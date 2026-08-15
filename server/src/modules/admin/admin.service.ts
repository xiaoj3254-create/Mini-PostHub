import { and, count, desc, eq, inArray, like, or, sql } from 'drizzle-orm';
import { db } from '../../config/db.js';
import {
  collectTable,
  commentTable,
  postTable,
  userTable,
  type UserRole,
  type UserStatus,
} from '../../db/schema.js';
import { countCommentSubtree } from '../../utils/commentSubtree.js';
import { forbidden, notFound } from '../../utils/http-error.js';
import { escapeLike } from '../../utils/like.js';
import { toPublicUser } from '../../utils/user.js';

/* ------------------------------ users ------------------------------ */

export async function listUsers(params: { keyword?: string; page: number; pageSize: number }) {
  const { keyword, page, pageSize } = params;
  const where = keyword
    ? or(
        like(userTable.username, `%${escapeLike(keyword)}%`),
        like(userTable.nickname, `%${escapeLike(keyword)}%`),
      )
    : undefined;

  const users = await db.query.userTable.findMany({
    where,
    orderBy: [desc(userTable.createdAt)],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  const [{ total }] = await db.select({ total: count() }).from(userTable).where(where);

  const ids = users.map((u) => u.id);
  const countRows = ids.length
    ? await db
        .select({ userId: postTable.userId, cnt: count(postTable.id) })
        .from(postTable)
        .where(inArray(postTable.userId, ids))
        .groupBy(postTable.userId)
    : [];
  const countMap = new Map(countRows.map((r) => [r.userId, Number(r.cnt)]));

  const list = users.map((u) => ({ ...toPublicUser(u), postCount: countMap.get(u.id) ?? 0 }));
  return { list, total, page, pageSize };
}

export async function setUserStatus(targetId: number, operatorId: number, status: UserStatus) {
  const target = await db.query.userTable.findFirst({ where: eq(userTable.id, targetId) });
  if (!target) throw notFound('用户不存在');
  if (target.role === 'admin') throw forbidden('不能封禁管理员');
  if (targetId === operatorId) throw forbidden('不能封禁自己');
  await db.update(userTable).set({ status }).where(eq(userTable.id, targetId));
  return toPublicUser({ ...target, status });
}

export async function setUserRole(targetId: number, operatorId: number, role: UserRole) {
  const target = await db.query.userTable.findFirst({ where: eq(userTable.id, targetId) });
  if (!target) throw notFound('用户不存在');
  if (target.role === 'admin') throw forbidden('不能修改管理员角色');
  if (targetId === operatorId) throw forbidden('不能修改自己的角色');
  await db.update(userTable).set({ role }).where(eq(userTable.id, targetId));
  return toPublicUser({ ...target, role });
}

/* ----------------------------- comments ---------------------------- */

export async function listComments(params: {
  postId?: number;
  keyword?: string;
  page: number;
  pageSize: number;
}) {
  const { postId, keyword, page, pageSize } = params;
  const where = and(
    postId ? eq(commentTable.postId, postId) : undefined,
    keyword ? like(commentTable.content, `%${escapeLike(keyword)}%`) : undefined,
  );

  const rows = await db
    .select({ comment: commentTable, author: userTable, post: postTable })
    .from(commentTable)
    .innerJoin(userTable, eq(commentTable.userId, userTable.id))
    .innerJoin(postTable, eq(commentTable.postId, postTable.id))
    .where(where)
    .orderBy(desc(commentTable.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [{ total }] = await db.select({ total: count() }).from(commentTable).where(where);

  const list = rows.map((r) => ({
    ...r.comment,
    author: toPublicUser(r.author),
    postTitle: r.post.title,
  }));
  return { list, total, page, pageSize };
}

export async function deleteCommentById(commentId: number): Promise<void> {
  const comment = await db.query.commentTable.findFirst({ where: eq(commentTable.id, commentId) });
  if (!comment) throw notFound('评论不存在');

  // MySQL DELETE 的 affectedRows 不含 FK 级联删除的后代，需先统计整棵子树再回填计数
  const subtree = await countCommentSubtree(commentId);
  await db.delete(commentTable).where(eq(commentTable.id, commentId));
  await db
    .update(postTable)
    .set({ commentCount: sql`GREATEST(${postTable.commentCount} - ${subtree}, 0)` })
    .where(eq(postTable.id, comment.postId));
}

/* ------------------------------ stats ------------------------------ */

export async function getStats() {
  const [users, posts, pendingPosts, approvedPosts, comments, collects, offShelfPosts] =
    await Promise.all([
      db.select({ total: count() }).from(userTable),
      db.select({ total: count() }).from(postTable),
      db.select({ total: count() }).from(postTable).where(eq(postTable.status, 'pending')),
      db.select({ total: count() }).from(postTable).where(eq(postTable.status, 'approved')),
      db.select({ total: count() }).from(commentTable),
      db.select({ total: count() }).from(collectTable),
      db
        .select({ total: count() })
        .from(postTable)
        .where(eq(postTable.isOffShelf, true)),
    ]);

  return {
    users: users[0].total,
    posts: posts[0].total,
    pendingPosts: pendingPosts[0].total,
    approvedPosts: approvedPosts[0].total,
    comments: comments[0].total,
    collects: collects[0].total,
    offShelfPosts: offShelfPosts[0].total,
  };
}

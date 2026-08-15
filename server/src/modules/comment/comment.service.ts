import { asc, eq, sql } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { commentTable, postTable, userTable, type Comment } from '../../db/schema.js';
import { badRequest, forbidden, notFound } from '../../utils/http-error.js';
import { countCommentSubtree } from '../../utils/commentSubtree.js';
import { toPublicUser, type PublicUser } from '../../utils/user.js';

export interface CommentWithAuthor extends Comment {
  author: PublicUser;
}

async function ensureCommentable(postId: number): Promise<void> {
  const post = await db.query.postTable.findFirst({ where: eq(postTable.id, postId) });
  if (!post) throw notFound('作品不存在');
  if (post.status !== 'approved' || post.isOffShelf) {
    throw badRequest('该作品当前不可评论');
  }
}

async function fetchCommentWithAuthor(commentId: number): Promise<CommentWithAuthor> {
  const rows = await db
    .select({ comment: commentTable, author: userTable })
    .from(commentTable)
    .innerJoin(userTable, eq(commentTable.userId, userTable.id))
    .where(eq(commentTable.id, commentId));
  if (!rows.length) throw notFound('评论不存在');
  const { comment, author } = rows[0];
  return { ...comment, author: toPublicUser(author) };
}

/**
 * Comments for a post: top-level (newest first) each with its replies (oldest first).
 * 任意层级的回复（含回复-回复）都归并到其所属的顶层评论下，保证可见。
 */
export async function listByPost(postId: number) {
  const rows = await db
    .select({ comment: commentTable, author: userTable })
    .from(commentTable)
    .innerJoin(userTable, eq(commentTable.userId, userTable.id))
    .where(eq(commentTable.postId, postId))
    .orderBy(asc(commentTable.createdAt));

  const comments = rows.map((r) => ({ ...r.comment, author: toPublicUser(r.author) }));
  const top = comments.filter((c) => c.parentId === null);
  const replies = comments.filter((c) => c.parentId !== null);

  // 沿 parentId 向上回溯到顶层评论，把每个回复挂到正确的顶层下
  const byId = new Map(comments.map((c) => [c.id, c]));
  const byTop = new Map<number, CommentWithAuthor[]>();
  for (const r of replies) {
    let cur = r;
    const seen = new Set<number>();
    while (cur.parentId !== null && !seen.has(cur.id)) {
      seen.add(cur.id);
      const parent = byId.get(cur.parentId);
      if (!parent) break;
      cur = parent;
    }
    const arr = byTop.get(cur.id) ?? [];
    arr.push(r);
    byTop.set(cur.id, arr);
  }

  return top
    .map((t) => ({ ...t, replies: (byTop.get(t.id) ?? []).reverse() }))
    .reverse();
}

export async function addComment(userId: number, postId: number, content: string): Promise<CommentWithAuthor> {
  await ensureCommentable(postId);
  const [inserted] = await db
    .insert(commentTable)
    .values({ userId, postId, content })
    .execute();
  await db
    .update(postTable)
    .set({ commentCount: sql`${postTable.commentCount} + 1` })
    .where(eq(postTable.id, postId));
  return fetchCommentWithAuthor(inserted.insertId);
}

export async function reply(userId: number, commentId: number, content: string): Promise<CommentWithAuthor> {
  const parent = await fetchCommentWithAuthor(commentId);
  await ensureCommentable(parent.postId);
  const [inserted] = await db
    .insert(commentTable)
    .values({ userId, postId: parent.postId, parentId: commentId, content })
    .execute();
  await db
    .update(postTable)
    .set({ commentCount: sql`${postTable.commentCount} + 1` })
    .where(eq(postTable.id, parent.postId));
  return fetchCommentWithAuthor(inserted.insertId);
}

export async function removeComment(userId: number, commentId: number, isAdmin = false): Promise<void> {
  const target = await fetchCommentWithAuthor(commentId);
  if (target.userId !== userId && !isAdmin) throw forbidden('无权删除该评论');

  // MySQL DELETE 的 affectedRows 不含 FK 级联删除的后代，需先统计整棵子树再回填计数
  const subtree = await countCommentSubtree(commentId);
  await db.delete(commentTable).where(eq(commentTable.id, commentId));
  await db
    .update(postTable)
    .set({ commentCount: sql`GREATEST(${postTable.commentCount} - ${subtree}, 0)` })
    .where(eq(postTable.id, target.postId));
}

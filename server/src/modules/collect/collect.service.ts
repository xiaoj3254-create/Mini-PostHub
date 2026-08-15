import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { categoryTable, collectTable, postTable, userTable } from '../../db/schema.js';
import { badRequest, notFound } from '../../utils/http-error.js';
import { toPublicUser } from '../../utils/user.js';

async function ensureCollectable(postId: number): Promise<void> {
  const post = await db.query.postTable.findFirst({ where: eq(postTable.id, postId) });
  if (!post) throw notFound('作品不存在');
  if (post.status !== 'approved' || post.isOffShelf) {
    throw badRequest('该作品当前不可收藏');
  }
}

export async function addCollect(userId: number, postId: number): Promise<void> {
  await ensureCollectable(postId);
  const exists = await db.query.collectTable.findFirst({
    where: and(eq(collectTable.userId, userId), eq(collectTable.postId, postId)),
  });
  if (exists) return; // idempotent

  try {
    await db.insert(collectTable).values({ userId, postId });
  } catch (e) {
    // 并发下撞 uq_collect_user_post 唯一索引（ER_DUP_ENTRY, errno 1062）视为已收藏，不报 500
    if ((e as { errno?: number })?.errno === 1062) return;
    throw e;
  }
  await db
    .update(postTable)
    .set({ favoriteCount: sql`${postTable.favoriteCount} + 1` })
    .where(eq(postTable.id, postId));
}

export async function removeCollect(userId: number, postId: number): Promise<void> {
  const [res] = await db
    .delete(collectTable)
    .where(and(eq(collectTable.userId, userId), eq(collectTable.postId, postId)));
  // 仅当确实存在收藏记录时才递减，避免重复取消把计数打到 0
  if (res.affectedRows > 0) {
    await db
      .update(postTable)
      .set({ favoriteCount: sql`GREATEST(${postTable.favoriteCount} - 1, 0)` })
      .where(eq(postTable.id, postId));
  }
}

export async function listMyCollects(userId: number) {
  const rows = await db
    .select({ collect: collectTable, post: postTable, author: userTable, category: categoryTable })
    .from(collectTable)
    .innerJoin(postTable, eq(collectTable.postId, postTable.id))
    .innerJoin(userTable, eq(postTable.userId, userTable.id))
    .innerJoin(categoryTable, eq(postTable.categoryId, categoryTable.id))
    .where(eq(collectTable.userId, userId))
    .orderBy(desc(collectTable.createdAt));

  return rows.map((r) => ({
    ...r.post,
    author: toPublicUser(r.author),
    category: r.category,
    collectedAt: r.collect.createdAt,
  }));
}

import { and, count, desc, eq, like, ne, or, sql } from 'drizzle-orm';
import { db } from '../../config/db.js';
import {
  categoryTable,
  collectTable,
  postTable,
  userTable,
  type NewPost,
  type Post,
  type PostStatus,
} from '../../db/schema.js';
import { badRequest, forbidden, notFound } from '../../utils/http-error.js';
import { escapeLike } from '../../utils/like.js';
import { toPublicUser, type PublicUser } from '../../utils/user.js';

export interface PostWithRelations extends Post {
  author: PublicUser;
  category: (typeof categoryTable.$inferSelect) | null;
}

export interface PostListParams {
  categoryId?: number;
  keyword?: string;
  sort?: 'latest' | 'hot';
  page: number;
  pageSize: number;
}

async function getById(id: number): Promise<Post> {
  const post = await db.query.postTable.findFirst({ where: eq(postTable.id, id) });
  if (!post) throw notFound('作品不存在');
  return post;
}

async function fetchWithRelations(postId: number): Promise<PostWithRelations | null> {
  const rows = await db
    .select({ post: postTable, author: userTable, category: categoryTable })
    .from(postTable)
    .innerJoin(userTable, eq(postTable.userId, userTable.id))
    .innerJoin(categoryTable, eq(postTable.categoryId, categoryTable.id))
    .where(eq(postTable.id, postId));
  if (!rows.length) return null;
  const { post, author, category } = rows[0];
  return { ...post, author: toPublicUser(author), category };
}

export async function listPublic(params: PostListParams) {
  const { categoryId, keyword, sort, page, pageSize } = params;
  const where = and(
    eq(postTable.status, 'approved'),
    eq(postTable.isOffShelf, false),
    categoryId ? eq(postTable.categoryId, categoryId) : undefined,
    keyword
      ? or(
          like(postTable.title, `%${escapeLike(keyword)}%`),
          like(postTable.content, `%${escapeLike(keyword)}%`),
        )
      : undefined,
  );

  const orderBy =
    sort === 'hot'
      ? [desc(postTable.favoriteCount), desc(postTable.viewCount)]
      : [desc(postTable.createdAt)];

  const rows = await db
    .select({ post: postTable, author: userTable, category: categoryTable })
    .from(postTable)
    .innerJoin(userTable, eq(postTable.userId, userTable.id))
    .innerJoin(categoryTable, eq(postTable.categoryId, categoryTable.id))
    .where(where)
    .orderBy(...orderBy)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [{ total }] = await db
    .select({ total: count() })
    .from(postTable)
    .where(where);

  const list = rows.map((r) => ({
    ...r.post,
    author: toPublicUser(r.author),
    category: r.category,
  }));
  return { list, total, page, pageSize };
}

/** Returns post detail for a viewer. Public only for approved & on-shelf posts. */
export async function getPostDetail(postId: number, viewer?: PublicUser) {
  const post = await fetchWithRelations(postId);
  if (!post) throw notFound('作品不存在');

  const isOwner = viewer?.id === post.userId;
  const isAdmin = viewer?.role === 'admin';
  const isPublic = post.status === 'approved' && !post.isOffShelf;
  if (!isPublic && !isOwner && !isAdmin) throw notFound('作品不存在');

  // 原子自增，避免并发下读-改-写丢增量；展示值按读到的计数 +1（并发差 1 可接受）
  await db
    .update(postTable)
    .set({ viewCount: sql`${postTable.viewCount} + 1` })
    .where(eq(postTable.id, postId));
  const newViewCount = post.viewCount + 1;

  let isCollected = false;
  if (viewer) {
    const c = await db.query.collectTable.findFirst({
      where: and(eq(collectTable.userId, viewer.id), eq(collectTable.postId, postId)),
    });
    isCollected = !!c;
  }

  const related = await listRelated(post.categoryId, postId);
  return { post: { ...post, viewCount: newViewCount, isCollected }, related };
}

export async function listRelated(categoryId: number, excludeId: number, limit = 6) {
  const rows = await db
    .select({ post: postTable, author: userTable, category: categoryTable })
    .from(postTable)
    .innerJoin(userTable, eq(postTable.userId, userTable.id))
    .innerJoin(categoryTable, eq(postTable.categoryId, categoryTable.id))
    .where(
      and(
        eq(postTable.categoryId, categoryId),
        eq(postTable.status, 'approved'),
        eq(postTable.isOffShelf, false),
        ne(postTable.id, excludeId),
      ),
    )
    .orderBy(desc(postTable.favoriteCount))
    .limit(limit);
  return rows.map((r) => ({ ...r.post, author: toPublicUser(r.author), category: r.category }));
}

export interface CreatePostData {
  title: string;
  content: string;
  categoryId: number;
  images?: string[];
  cover?: string;
  status?: 'draft' | 'pending';
}

export async function createPost(userId: number, data: CreatePostData): Promise<Post> {
  const category = await db.query.categoryTable.findFirst({
    where: eq(categoryTable.id, data.categoryId),
  });
  if (!category) throw badRequest('分类不存在');
  if (!category.isEnabled) throw badRequest('该分类已禁用');

  const images = data.images ?? [];
  const newPost: NewPost = {
    userId,
    categoryId: data.categoryId,
    title: data.title.trim(),
    content: data.content,
    images,
    cover: data.cover || images[0] || null,
    status: data.status === 'pending' ? 'pending' : 'draft',
  };
  const [inserted] = await db.insert(postTable).values(newPost);
  return getById(inserted.insertId);
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  categoryId?: number;
  images?: string[];
  cover?: string;
}

export async function updatePost(
  userId: number,
  postId: number,
  data: UpdatePostData,
  isAdmin = false,
): Promise<Post> {
  const post = await getById(postId);
  if (post.userId !== userId && !isAdmin) throw forbidden('无权操作该作品');
  // State machine: only draft / rejected can be edited (pending is locked).
  if (post.status !== 'draft' && post.status !== 'rejected') {
    throw badRequest('待审核或已发布作品不可编辑');
  }

  if (data.categoryId !== undefined) {
    const category = await db.query.categoryTable.findFirst({
      where: eq(categoryTable.id, data.categoryId),
    });
    if (!category) throw badRequest('分类不存在');
    if (!category.isEnabled) throw badRequest('该分类已禁用');
  }

  const images = data.images ?? post.images ?? [];
  const patch: Partial<Post> = {
    title: data.title?.trim() || post.title,
    content: data.content ?? post.content,
    categoryId: data.categoryId ?? post.categoryId,
    images,
    // 编辑时以实际图片为准：清空图片则封面置 null，未传 images 则沿用原有封面
    cover: data.cover ?? images[0] ?? null,
  };
  await db.update(postTable).set(patch).where(eq(postTable.id, postId));
  return getById(postId);
}

/** draft / rejected -> pending */
export async function submitPost(userId: number, postId: number): Promise<Post> {
  const post = await getById(postId);
  if (post.userId !== userId) throw forbidden('无权操作该作品');
  if (post.status !== 'draft' && post.status !== 'rejected') {
    throw badRequest('当前状态不可提交审核');
  }
  await db
    .update(postTable)
    .set({ status: 'pending' as PostStatus, rejectReason: null })
    .where(eq(postTable.id, postId));
  return getById(postId);
}

export async function deletePost(userId: number, postId: number, isAdmin = false): Promise<void> {
  const post = await getById(postId);
  if (post.userId !== userId && !isAdmin) throw forbidden('无权操作该作品');
  await db.delete(postTable).where(eq(postTable.id, postId));
}

export async function listMyPosts(userId: number, status?: PostStatus) {
  const rows = await db
    .select({ post: postTable, category: categoryTable })
    .from(postTable)
    .innerJoin(categoryTable, eq(postTable.categoryId, categoryTable.id))
    .where(and(eq(postTable.userId, userId), status ? eq(postTable.status, status) : undefined))
    .orderBy(desc(postTable.createdAt));
  return rows.map((r) => ({ ...r.post, category: r.category }));
}

/** Admin: query all posts with filters. */
export async function listAll(params: {
  status?: PostStatus;
  categoryId?: number;
  keyword?: string;
  page: number;
  pageSize: number;
}) {
  const { status, categoryId, keyword, page, pageSize } = params;
  const where = and(
    status ? eq(postTable.status, status) : undefined,
    categoryId ? eq(postTable.categoryId, categoryId) : undefined,
    keyword
      ? or(
          like(postTable.title, `%${escapeLike(keyword)}%`),
          like(postTable.content, `%${escapeLike(keyword)}%`),
        )
      : undefined,
  );

  const rows = await db
    .select({ post: postTable, author: userTable, category: categoryTable })
    .from(postTable)
    .innerJoin(userTable, eq(postTable.userId, userTable.id))
    .innerJoin(categoryTable, eq(postTable.categoryId, categoryTable.id))
    .where(where)
    .orderBy(desc(postTable.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [{ total }] = await db.select({ total: count() }).from(postTable).where(where);

  const list = rows.map((r) => ({
    ...r.post,
    author: toPublicUser(r.author),
    category: r.category,
  }));
  return { list, total, page, pageSize };
}

/** pending -> approved (admin) */
export async function approvePost(postId: number): Promise<Post> {
  const post = await getById(postId);
  if (post.status !== 'pending') throw badRequest('仅待审核作品可执行该操作');
  await db
    .update(postTable)
    .set({ status: 'approved' as PostStatus, rejectReason: null })
    .where(eq(postTable.id, postId));
  return getById(postId);
}

/** pending -> rejected with reason (admin) */
export async function rejectPost(postId: number, reason: string): Promise<Post> {
  const post = await getById(postId);
  if (post.status !== 'pending') throw badRequest('仅待审核作品可执行该操作');
  await db
    .update(postTable)
    .set({ status: 'rejected' as PostStatus, rejectReason: reason })
    .where(eq(postTable.id, postId));
  return getById(postId);
}

/** Toggle off-shelf flag (admin) */
export async function toggleOffShelf(postId: number, isOffShelf: boolean): Promise<Post> {
  const post = await getById(postId);
  if (post.status !== 'approved') throw badRequest('仅已发布作品可下架/恢复');
  await db.update(postTable).set({ isOffShelf }).where(eq(postTable.id, postId));
  return getById(postId);
}

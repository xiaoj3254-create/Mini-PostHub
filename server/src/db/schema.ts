import {
  boolean,
  bigint,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
  type AnyMySqlColumn,
} from 'drizzle-orm/mysql-core';

export const userRole = ['user', 'admin'] as const;
export const userStatus = ['active', 'banned'] as const;
export const postStatus = ['draft', 'pending', 'approved', 'rejected'] as const;

export type UserRole = (typeof userRole)[number];
export type UserStatus = (typeof userStatus)[number];
export type PostStatus = (typeof postStatus)[number];

export const userTable = mysqlTable('user', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 100 }).notNull(),
  nickname: varchar('nickname', { length: 50 }).notNull().default(''),
  avatar: varchar('avatar', { length: 255 }),
  bio: varchar('bio', { length: 255 }),
  role: mysqlEnum('role', userRole).notNull().default('user'),
  status: mysqlEnum('status', userStatus).notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const categoryTable = mysqlTable('category', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: varchar('description', { length: 200 }),
  sort: int('sort').notNull().default(0),
  isEnabled: boolean('is_enabled').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const postTable = mysqlTable(
  'post',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    userId: bigint('user_id', { mode: 'number' }).notNull().references(() => userTable.id),
    categoryId: bigint('category_id', { mode: 'number' }).notNull().references(() => categoryTable.id),
    title: varchar('title', { length: 100 }).notNull(),
    content: text('content').notNull(),
    images: json('images').$type<string[]>().default([]),
    cover: varchar('cover', { length: 255 }),
    status: mysqlEnum('status', postStatus).notNull().default('draft'),
    rejectReason: varchar('reject_reason', { length: 255 }),
    isOffShelf: boolean('is_off_shelf').notNull().default(false),
    viewCount: int('view_count').notNull().default(0),
    favoriteCount: int('favorite_count').notNull().default(0),
    commentCount: int('comment_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    statusCategoryIdx: index('idx_post_status_category').on(t.status, t.categoryId),
    statusCreatedIdx: index('idx_post_status_created').on(t.status, t.createdAt),
    userIdx: index('idx_post_user').on(t.userId),
  }),
);

export const commentTable = mysqlTable(
  'comment',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    postId: bigint('post_id', { mode: 'number' })
      .notNull()
      .references(() => postTable.id, { onDelete: 'cascade' }),
    userId: bigint('user_id', { mode: 'number' }).notNull().references(() => userTable.id),
    parentId: bigint('parent_id', { mode: 'number' }).references(
      (): AnyMySqlColumn => commentTable.id,
      { onDelete: 'cascade' },
    ),
    content: varchar('content', { length: 500 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({ postIdx: index('idx_comment_post').on(t.postId) }),
);

export const collectTable = mysqlTable(
  'collect',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    postId: bigint('post_id', { mode: 'number' })
      .notNull()
      .references(() => postTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    userPostIdx: uniqueIndex('uq_collect_user_post').on(t.userId, t.postId),
    postIdx: index('idx_collect_post').on(t.postId),
  }),
);

export type User = typeof userTable.$inferSelect;
export type NewUser = typeof userTable.$inferInsert;
export type Category = typeof categoryTable.$inferSelect;
export type NewCategory = typeof categoryTable.$inferInsert;
export type Post = typeof postTable.$inferSelect;
export type NewPost = typeof postTable.$inferInsert;
export type Comment = typeof commentTable.$inferSelect;
export type NewComment = typeof commentTable.$inferInsert;
export type Collect = typeof collectTable.$inferSelect;
export type NewCollect = typeof collectTable.$inferInsert;

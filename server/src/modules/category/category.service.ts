import { asc, count, eq } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { categoryTable, postTable, type NewCategory } from '../../db/schema.js';
import { badRequest, notFound } from '../../utils/http-error.js';

/** Public list: only enabled categories, ordered by sort. */
export async function listPublic() {
  return db.query.categoryTable.findMany({
    where: eq(categoryTable.isEnabled, true),
    orderBy: [asc(categoryTable.sort), asc(categoryTable.id)],
  });
}

/** Admin list: all categories. */
export async function listAll() {
  return db.query.categoryTable.findMany({
    orderBy: [asc(categoryTable.sort), asc(categoryTable.id)],
  });
}

export async function getById(id: number) {
  const category = await db.query.categoryTable.findFirst({ where: eq(categoryTable.id, id) });
  if (!category) throw notFound('分类不存在');
  return category;
}

export async function create(data: NewCategory) {
  const exists = await db.query.categoryTable.findFirst({
    where: eq(categoryTable.name, data.name),
  });
  if (exists) throw badRequest('分类名已存在');
  const [inserted] = await db.insert(categoryTable).values(data);
  return getById(inserted.insertId);
}

export async function update(id: number, data: Partial<NewCategory>) {
  await getById(id);
  if (data.name !== undefined) {
    const anyDup = await db.query.categoryTable.findFirst({
      where: eq(categoryTable.name, data.name),
    });
    if (anyDup && anyDup.id !== id) throw badRequest('分类名已存在');
  }
  await db.update(categoryTable).set(data).where(eq(categoryTable.id, id));
  return getById(id);
}

export async function remove(id: number) {
  await getById(id);
  // 外键为 ON DELETE NO ACTION，有作品引用时直接删除会抛 ER_ROW_IS_REFERENCED_2 → 500，
  // 这里提前检查并返回友好错误
  const [{ total }] = await db
    .select({ total: count() })
    .from(postTable)
    .where(eq(postTable.categoryId, id));
  if (total > 0) throw badRequest('该分类下仍有作品，无法删除');
  await db.delete(categoryTable).where(eq(categoryTable.id, id));
}

import { sql } from 'drizzle-orm';
import { db } from '../config/db.js';
import { commentTable } from '../db/schema.js';

/**
 * 统计指定评论及全部后代（含回复-回复）的评论数。
 *
 * 删除评论时 comment.post_id / comment.parent_id 均为 ON DELETE CASCADE，
 * 但 MySQL DELETE 的 affectedRows 只计入直接删除的行、不含级联删除的后代，
 * 因此计数回填前必须先按整棵子树数递减。
 */
export async function countCommentSubtree(commentId: number): Promise<number> {
  const [result] = await db.execute<{ cnt: number }>(sql`
    WITH RECURSIVE cte AS (
      SELECT ${commentTable.id} FROM ${commentTable} WHERE ${commentTable.id} = ${commentId}
      UNION ALL
      SELECT ${commentTable.id} FROM ${commentTable}
      INNER JOIN cte ON ${commentTable.parentId} = cte.id
    )
    SELECT COUNT(*) AS cnt FROM cte
  `);
  // mysql2 对 SELECT 的 execute 返回 [rows, fields]，result[0] 即行数组，类型签名上是 ResultSetHeader，需断言
  const rows = result as unknown as { cnt: number }[];
  return Number(rows[0]?.cnt ?? 0);
}

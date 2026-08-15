/**
 * 转义 LIKE 模式中的通配符，使关键词按字面匹配。
 * MySQL 默认用反斜杠作为 LIKE 转义符（未开启 NO_BACKSLASH_ESCAPES）。
 */
export function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (m) => `\\${m}`);
}

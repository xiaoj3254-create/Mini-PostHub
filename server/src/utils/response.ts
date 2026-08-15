import type { Response } from 'express';

// Unified response shape: { code, message, data }
// code: 0 = success, 1 = error (HTTP status carries the real code)
export function ok<T>(res: Response, data: T, message = 'ok') {
  return res.json({ code: 0, message, data });
}

export function okPaginated<T>(
  res: Response,
  { list, total, page, pageSize }: { list: T[]; total: number; page: number; pageSize: number },
) {
  return ok(res, { list, total, page, pageSize });
}

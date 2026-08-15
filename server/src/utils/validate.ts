import type { z } from 'zod';
import { badRequest } from './http-error.js';

export function parseBody<S extends z.ZodTypeAny>(schema: S, body: unknown): z.output<S> {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw badRequest(result.error.issues[0]?.message || '参数错误');
  }
  return result.data;
}

export function parseQuery<S extends z.ZodTypeAny>(schema: S, query: unknown): z.output<S> {
  return parseBody(schema, query);
}

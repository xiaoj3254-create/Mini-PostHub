import type { Request, Response } from 'express';
import { z } from 'zod';
import { badRequest } from '../../utils/http-error.js';
import { ok } from '../../utils/response.js';
import { parseBody } from '../../utils/validate.js';
import * as commentService from './comment.service.js';

const commentSchema = z.object({
  content: z.string().trim().min(1).max(500),
});

function idParam(value: unknown): number {
  const id = typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isInteger(id) || id <= 0) throw badRequest('参数错误');
  return id;
}

export async function listByPost(req: Request, res: Response) {
  const list = await commentService.listByPost(idParam(req.params.postId));
  ok(res, list);
}

export async function addComment(req: Request, res: Response) {
  const { content } = parseBody(commentSchema, req.body);
  const comment = await commentService.addComment(req.user!.id, idParam(req.params.postId), content);
  ok(res, comment, '评论成功');
}

export async function reply(req: Request, res: Response) {
  const { content } = parseBody(commentSchema, req.body);
  const comment = await commentService.reply(req.user!.id, idParam(req.params.commentId), content);
  ok(res, comment, '回复成功');
}

export async function removeComment(req: Request, res: Response) {
  await commentService.removeComment(req.user!.id, idParam(req.params.id), req.user!.role === 'admin');
  ok(res, null, '评论已删除');
}

import type { Request, Response } from 'express';
import { badRequest } from '../../utils/http-error.js';
import { ok } from '../../utils/response.js';
import * as collectService from './collect.service.js';

function idParam(value: unknown): number {
  const id = typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isInteger(id) || id <= 0) throw badRequest('参数错误');
  return id;
}

export async function addCollect(req: Request, res: Response) {
  await collectService.addCollect(req.user!.id, idParam(req.params.postId));
  ok(res, null, '收藏成功');
}

export async function removeCollect(req: Request, res: Response) {
  await collectService.removeCollect(req.user!.id, idParam(req.params.postId));
  ok(res, null, '已取消收藏');
}

export async function listMyCollects(req: Request, res: Response) {
  const list = await collectService.listMyCollects(req.user!.id);
  ok(res, list);
}

import type { Request, Response } from 'express';
import { ok } from '../../utils/response.js';
import * as categoryService from './category.service.js';

export async function listPublic(_req: Request, res: Response) {
  const list = await categoryService.listPublic();
  ok(res, list);
}

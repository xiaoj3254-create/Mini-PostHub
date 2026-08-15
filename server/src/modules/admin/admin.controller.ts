import type { Request, Response } from 'express';
import { z } from 'zod';
import { badRequest } from '../../utils/http-error.js';
import { ok, okPaginated } from '../../utils/response.js';
import { parseBody, parseQuery } from '../../utils/validate.js';
import * as postService from '../post/post.service.js';
import * as categoryService from '../category/category.service.js';
import * as adminService from './admin.service.js';

function idParam(value: unknown): number {
  const id = typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isInteger(id) || id <= 0) throw badRequest('参数错误');
  return id;
}

const postsQuerySchema = z.object({
  status: z.enum(['draft', 'pending', 'approved', 'rejected']).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  keyword: z.string().trim().max(50).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

const usersQuerySchema = z.object({
  keyword: z.string().trim().max(50).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

const commentsQuerySchema = z.object({
  postId: z.coerce.number().int().positive().optional(),
  keyword: z.string().trim().max(50).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

const rejectSchema = z.object({
  reason: z.string().trim().min(1).max(255),
});

const offShelfSchema = z.object({
  isOffShelf: z.boolean(),
});

const categorySchema = z.object({
  name: z.string().trim().min(1).max(50),
  description: z.string().trim().max(200).optional().nullable(),
  sort: z.coerce.number().int().min(0).max(9999).optional(),
  isEnabled: z.boolean().optional(),
});

const userStatusSchema = z.object({
  status: z.enum(['active', 'banned']),
});

const userRoleSchema = z.object({
  role: z.enum(['user', 'admin']),
});

/* ------------------------------- stats ------------------------------ */

export async function stats(_req: Request, res: Response) {
  const data = await adminService.getStats();
  ok(res, data);
}

/* ------------------------------- posts ------------------------------ */

export async function listPosts(req: Request, res: Response) {
  const q = parseQuery(postsQuerySchema, req.query);
  const result = await postService.listAll(q);
  okPaginated(res, result);
}

export async function approvePost(req: Request, res: Response) {
  const post = await postService.approvePost(idParam(req.params.id));
  ok(res, post, '已通过审核');
}

export async function rejectPost(req: Request, res: Response) {
  const { reason } = parseBody(rejectSchema, req.body);
  const post = await postService.rejectPost(idParam(req.params.id), reason);
  ok(res, post, '已驳回');
}

export async function toggleOffShelf(req: Request, res: Response) {
  const { isOffShelf } = parseBody(offShelfSchema, req.body);
  const post = await postService.toggleOffShelf(idParam(req.params.id), isOffShelf);
  ok(res, post, isOffShelf ? '已下架' : '已恢复展示');
}

export async function removePost(req: Request, res: Response) {
  await postService.deletePost(req.user!.id, idParam(req.params.id), true);
  ok(res, null, '作品已删除');
}

/* ----------------------------- categories ---------------------------- */

export async function listCategories(_req: Request, res: Response) {
  const list = await categoryService.listAll();
  ok(res, list);
}

export async function createCategory(req: Request, res: Response) {
  const data = parseBody(categorySchema, req.body);
  const category = await categoryService.create(data);
  ok(res, category, '分类已创建');
}

export async function updateCategory(req: Request, res: Response) {
  const data = parseBody(categorySchema.partial(), req.body);
  const category = await categoryService.update(idParam(req.params.id), data);
  ok(res, category, '分类已更新');
}

export async function removeCategory(req: Request, res: Response) {
  await categoryService.remove(idParam(req.params.id));
  ok(res, null, '分类已删除');
}

/* ------------------------------- users ------------------------------ */

export async function listUsers(req: Request, res: Response) {
  const q = parseQuery(usersQuerySchema, req.query);
  const result = await adminService.listUsers(q);
  okPaginated(res, result);
}

export async function setUserStatus(req: Request, res: Response) {
  const { status } = parseBody(userStatusSchema, req.body);
  const user = await adminService.setUserStatus(idParam(req.params.id), req.user!.id, status);
  ok(res, user, status === 'banned' ? '已封禁' : '已解封');
}

export async function setUserRole(req: Request, res: Response) {
  const { role } = parseBody(userRoleSchema, req.body);
  const user = await adminService.setUserRole(idParam(req.params.id), req.user!.id, role);
  ok(res, user, '角色已更新');
}

/* ------------------------------ comments ----------------------------- */

export async function listComments(req: Request, res: Response) {
  const q = parseQuery(commentsQuerySchema, req.query);
  const result = await adminService.listComments(q);
  okPaginated(res, result);
}

export async function removeComment(req: Request, res: Response) {
  await adminService.deleteCommentById(idParam(req.params.id));
  ok(res, null, '评论已删除');
}

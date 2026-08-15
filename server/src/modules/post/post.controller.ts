import type { Request, Response } from 'express';
import { z } from 'zod';
import type { PostStatus } from '../../db/schema.js';
import { badRequest } from '../../utils/http-error.js';
import { ok, okPaginated } from '../../utils/response.js';
import { parseBody, parseQuery } from '../../utils/validate.js';
import * as postService from './post.service.js';

const postStatusSchema = z.enum(['draft', 'pending', 'approved', 'rejected']);

const listQuerySchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
  keyword: z.string().trim().max(50).optional(),
  sort: z.enum(['latest', 'hot']).default('latest'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

const createSchema = z.object({
  title: z.string().trim().min(1).max(100),
  content: z.string().min(1).max(10000),
  categoryId: z.coerce.number().int().positive(),
  images: z.array(z.string().max(255)).max(9).optional(),
  cover: z.string().max(255).optional(),
  status: z.enum(['draft', 'pending']).optional(),
});

const updateSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  content: z.string().min(1).max(10000).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  images: z.array(z.string().max(255)).max(9).optional(),
  cover: z.string().max(255).optional(),
});

const myPostsQuerySchema = z.object({
  status: postStatusSchema.optional(),
});

function postId(req: Request): number {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw badRequest('参数错误');
  return id;
}

export async function listPublic(req: Request, res: Response) {
  const q = parseQuery(listQuerySchema, req.query);
  const result = await postService.listPublic(q);
  okPaginated(res, result);
}

export async function getById(req: Request, res: Response) {
  const result = await postService.getPostDetail(postId(req), req.user);
  ok(res, result);
}

export async function listMyPosts(req: Request, res: Response) {
  const q = parseQuery(myPostsQuerySchema, req.query);
  const list = await postService.listMyPosts(req.user!.id, q.status as PostStatus | undefined);
  ok(res, list);
}

export async function createPost(req: Request, res: Response) {
  const data = parseBody(createSchema, req.body);
  const post = await postService.createPost(req.user!.id, data);
  ok(res, post, '作品已保存');
}

export async function updatePost(req: Request, res: Response) {
  const data = parseBody(updateSchema, req.body);
  const post = await postService.updatePost(req.user!.id, postId(req), data);
  ok(res, post, '作品已更新');
}

export async function submitPost(req: Request, res: Response) {
  const post = await postService.submitPost(req.user!.id, postId(req));
  ok(res, post, '已提交审核');
}

export async function deletePost(req: Request, res: Response) {
  await postService.deletePost(req.user!.id, postId(req));
  ok(res, null, '作品已删除');
}

export async function uploadImage(req: Request, res: Response) {
  if (!req.file) throw badRequest('请选择要上传的图片');
  const url = `/uploads/${req.file.filename}`;
  ok(res, { url }, '上传成功');
}

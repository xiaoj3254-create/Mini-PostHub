import type { Request, Response } from 'express';
import { z } from 'zod';
import { badRequest } from '../../utils/http-error.js';
import { ok } from '../../utils/response.js';
import * as authService from './auth.service.js';

const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字、下划线'),
  password: z.string().min(6).max(50),
  nickname: z.string().min(1).max(30).optional(),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const profileSchema = z.object({
  nickname: z.string().min(1).max(30).optional(),
  avatar: z.string().max(255).nullable().optional(),
  bio: z.string().max(255).optional(),
});

const passwordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6).max(50),
});

function parse<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw badRequest(result.error.issues[0]?.message || '参数错误');
  }
  return result.data;
}

export async function register(req: Request, res: Response) {
  const data = parse(registerSchema, req.body);
  const result = await authService.register(data);
  ok(res, result, '注册成功');
}

export async function login(req: Request, res: Response) {
  const data = parse(loginSchema, req.body);
  const result = await authService.login(data);
  ok(res, result, '登录成功');
}

export async function me(req: Request, res: Response) {
  const user = await authService.getProfile(req.user!.id);
  ok(res, user);
}

export async function updateProfile(req: Request, res: Response) {
  const data = parse(profileSchema, req.body);
  const user = await authService.updateProfile(req.user!.id, data);
  ok(res, user, '资料已更新');
}

export async function changePassword(req: Request, res: Response) {
  const data = parse(passwordSchema, req.body);
  await authService.changePassword(req.user!.id, data);
  ok(res, null, '密码已修改');
}

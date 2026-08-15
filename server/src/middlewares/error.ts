import type { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { HttpError } from '../utils/http-error.js';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ code: 1, message: '接口不存在', data: null });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ code: 1, message: err.message, data: null });
  }
  if (err instanceof MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? '图片大小不能超过 5MB' : '文件上传失败';
    return res.status(400).json({ code: 1, message, data: null });
  }
  console.error('[error]', err);
  return res.status(500).json({ code: 1, message: '服务器内部错误', data: null });
}

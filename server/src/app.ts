import cors from 'cors';
import express from 'express';
import { authRouter } from './modules/auth/auth.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { categoryRouter } from './modules/category/category.routes.js';
import { collectRouter } from './modules/collect/collect.routes.js';
import { commentRouter } from './modules/comment/comment.routes.js';
import { postRouter } from './modules/post/post.routes.js';
import { errorHandler, notFound } from './middlewares/error.js';
import { uploadDir } from './middlewares/upload.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Static hosting for uploaded images.
  app.use('/uploads', express.static(uploadDir));

  app.get('/api/health', (_req, res) => {
    res.json({ code: 0, message: 'ok', data: { uptime: process.uptime() } });
  });

  // All routers define full /api paths themselves.
  app.use('/api', authRouter);
  app.use('/api', categoryRouter);
  app.use('/api', postRouter);
  app.use('/api', commentRouter);
  app.use('/api', collectRouter);
  app.use('/api', adminRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

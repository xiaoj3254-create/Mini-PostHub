import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import * as ctrl from './comment.controller.js';

export const commentRouter = Router();

commentRouter.get('/posts/:postId/comments', ctrl.listByPost);
commentRouter.post('/posts/:postId/comments', requireAuth, ctrl.addComment);
commentRouter.post('/comments/:commentId/reply', requireAuth, ctrl.reply);
commentRouter.delete('/comments/:id', requireAuth, ctrl.removeComment);

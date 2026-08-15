import { Router } from 'express';
import { optionalAuth, requireAuth } from '../../middlewares/auth.js';
import { uploadSingle } from '../../middlewares/upload.js';
import * as ctrl from './post.controller.js';

export const postRouter = Router();

postRouter.get('/posts', ctrl.listPublic);
postRouter.get('/posts/:id', optionalAuth, ctrl.getById);
postRouter.get('/me/posts', requireAuth, ctrl.listMyPosts);

postRouter.post('/posts', requireAuth, ctrl.createPost);
postRouter.put('/posts/:id', requireAuth, ctrl.updatePost);
postRouter.post('/posts/:id/submit', requireAuth, ctrl.submitPost);
postRouter.delete('/posts/:id', requireAuth, ctrl.deletePost);

postRouter.post('/uploads', requireAuth, uploadSingle, ctrl.uploadImage);

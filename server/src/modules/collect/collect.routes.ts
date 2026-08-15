import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import * as ctrl from './collect.controller.js';

export const collectRouter = Router();

collectRouter.get('/me/collects', requireAuth, ctrl.listMyCollects);
collectRouter.post('/posts/:postId/collect', requireAuth, ctrl.addCollect);
collectRouter.delete('/posts/:postId/collect', requireAuth, ctrl.removeCollect);

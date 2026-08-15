import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import * as ctrl from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/auth/register', ctrl.register);
authRouter.post('/auth/login', ctrl.login);
authRouter.get('/auth/me', requireAuth, ctrl.me);
authRouter.put('/auth/profile', requireAuth, ctrl.updateProfile);
authRouter.put('/auth/password', requireAuth, ctrl.changePassword);

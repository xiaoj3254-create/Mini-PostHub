import { Router } from 'express';
import * as ctrl from './category.controller.js';

export const categoryRouter = Router();

categoryRouter.get('/categories', ctrl.listPublic);

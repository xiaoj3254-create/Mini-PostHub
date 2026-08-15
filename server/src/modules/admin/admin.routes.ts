import { Router } from 'express';
import { requireAdmin, requireAuth } from '../../middlewares/auth.js';
import * as ctrl from './admin.controller.js';

export const adminRouter = Router();

adminRouter.use('/admin', requireAuth, requireAdmin);

// stats
adminRouter.get('/admin/stats', ctrl.stats);

// posts
adminRouter.get('/admin/posts', ctrl.listPosts);
adminRouter.post('/admin/posts/:id/approve', ctrl.approvePost);
adminRouter.post('/admin/posts/:id/reject', ctrl.rejectPost);
adminRouter.post('/admin/posts/:id/off-shelf', ctrl.toggleOffShelf);
adminRouter.delete('/admin/posts/:id', ctrl.removePost);

// categories
adminRouter.get('/admin/categories', ctrl.listCategories);
adminRouter.post('/admin/categories', ctrl.createCategory);
adminRouter.put('/admin/categories/:id', ctrl.updateCategory);
adminRouter.delete('/admin/categories/:id', ctrl.removeCategory);

// users
adminRouter.get('/admin/users', ctrl.listUsers);
adminRouter.put('/admin/users/:id/status', ctrl.setUserStatus);
adminRouter.put('/admin/users/:id/role', ctrl.setUserRole);

// comments
adminRouter.get('/admin/comments', ctrl.listComments);
adminRouter.delete('/admin/comments/:id', ctrl.removeComment);

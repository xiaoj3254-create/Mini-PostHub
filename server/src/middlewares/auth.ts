import type { NextFunction, Request, Response } from 'express';
import { db } from '../config/db.js';
import { userTable } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { forbidden, unauthorized } from '../utils/http-error.js';
import { verifyToken } from '../utils/jwt.js';

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw unauthorized();

    const payload = verifyToken(token);
    const user = await db.query.userTable.findFirst({
      where: eq(userTable.id, payload.userId),
    });
    if (!user) throw unauthorized();
    if (user.status === 'banned') throw forbidden('账号已被封禁');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return next(forbidden('无管理员权限'));
  }
  next();
}

/** Sets req.user when a valid token is present, but never rejects the request. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const payload = verifyToken(token);
      const user = await db.query.userTable.findFirst({
        where: eq(userTable.id, payload.userId),
      });
      if (user && user.status === 'active') req.user = user;
    } catch {
      // ignore invalid token
    }
  }
  next();
}

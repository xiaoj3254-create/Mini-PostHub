import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { userTable, type NewUser, type User } from '../../db/schema.js';
import { badRequest, notFound, unauthorized } from '../../utils/http-error.js';
import { signToken } from '../../utils/jwt.js';

const SALT_ROUNDS = 10;

export interface AuthResult {
  user: Omit<User, 'password'>;
  token: string;
}

export async function register(data: { username: string; password: string; nickname?: string }): Promise<AuthResult> {
  const exists = await db.query.userTable.findFirst({
    where: eq(userTable.username, data.username),
  });
  if (exists) throw badRequest('用户名已被占用');

  const hash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const newUser: NewUser = {
    username: data.username,
    password: hash,
    nickname: data.nickname?.trim() || data.username,
  };
  const [inserted] = await db.insert(userTable).values(newUser);
  const user = await db.query.userTable.findFirst({ where: eq(userTable.id, inserted.insertId) });
  if (!user) throw new Error('注册失败');

  const { password: _pw, ...publicUser } = user;
  return { user: publicUser, token: signToken(user.id) };
}

export async function login(data: { username: string; password: string }): Promise<AuthResult> {
  const user = await db.query.userTable.findFirst({
    where: eq(userTable.username, data.username),
  });
  if (!user) throw unauthorized('用户名或密码错误');
  if (user.status === 'banned') throw unauthorized('账号已被封禁');

  const match = await bcrypt.compare(data.password, user.password);
  if (!match) throw unauthorized('用户名或密码错误');

  const { password: _pw, ...publicUser } = user;
  return { user: publicUser, token: signToken(user.id) };
}

export async function getProfile(userId: number): Promise<Omit<User, 'password'>> {
  const user = await db.query.userTable.findFirst({ where: eq(userTable.id, userId) });
  if (!user) throw notFound('用户不存在');
  const { password: _pw, ...publicUser } = user;
  return publicUser;
}

export async function updateProfile(
  userId: number,
  data: { nickname?: string; avatar?: string | null; bio?: string },
): Promise<Omit<User, 'password'>> {
  const patch: Partial<User> = {};
  if (data.nickname !== undefined) patch.nickname = data.nickname.trim();
  if (data.avatar !== undefined) patch.avatar = data.avatar; // null clears the avatar
  if (data.bio !== undefined) patch.bio = data.bio;

  await db.update(userTable).set(patch).where(eq(userTable.id, userId));
  return getProfile(userId);
}

export async function changePassword(
  userId: number,
  data: { oldPassword: string; newPassword: string },
): Promise<void> {
  const user = await db.query.userTable.findFirst({ where: eq(userTable.id, userId) });
  if (!user) throw notFound('用户不存在');
  const match = await bcrypt.compare(data.oldPassword, user.password);
  if (!match) throw badRequest('原密码错误');

  const hash = await bcrypt.hash(data.newPassword, SALT_ROUNDS);
  await db.update(userTable).set({ password: hash }).where(eq(userTable.id, userId));
}

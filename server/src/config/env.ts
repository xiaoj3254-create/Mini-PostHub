import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().default('mini_posthub'),
  // 必填：缺省时直接启动失败，避免在未配置密钥的部署中生成可伪造的 token
  JWT_SECRET: z.string().min(1, 'JWT_SECRET 未配置，请在 server/.env 中设置'),
  JWT_EXPIRES_IN: z.string().default('7d'),
});

export const env = envSchema.parse(process.env);

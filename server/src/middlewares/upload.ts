import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { badRequest } from '../utils/http-error.js';

export const uploadDir = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

// 仅允许栅格图片。不允许 svg：SVG 可内嵌脚本，同源静态托管存在存储型 XSS 风险。
const MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    // 扩展名由服务端按 MIME 决定，不信任客户端提供的文件名
    cb(null, `${Date.now()}_${crypto.randomBytes(8).toString('hex')}${MIME_EXT[file.mimetype] || '.png'}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!MIME_EXT[file.mimetype]) {
      return cb(badRequest('仅支持上传 jpg / png / webp / gif 图片'));
    }
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      return cb(badRequest('文件扩展名不受支持'));
    }
    cb(null, true);
  },
});

export const uploadSingle = upload.single('file');

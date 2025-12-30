import fs from 'node:fs';
import path from 'node:path';

export default defineEventHandler((event) => {
  const relativePath = getRouterParam(event, 'path');
  if (!relativePath) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid path' });
  }

  // 统一指向 /root/public
  const baseDir = path.join(process.cwd(), 'public');
  const filePath = path.join(baseDir, relativePath);

  // 安全检查
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(path.resolve(baseDir))) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }

  if (fs.existsSync(filePath)) {
    // 生产环境缓存
    if (process.env.NODE_ENV === 'production') {
      setResponseHeader(event, 'Cache-Control', 'public, max-age=604800, immutable');
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.webp': 'image/webp',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
    };

    if (mimeMap[ext]) {
      setResponseHeader(event, 'Content-Type', mimeMap[ext]);
    }

    return fs.readFileSync(filePath);
  }

  throw createError({
    statusCode: 404,
    statusMessage: 'File not found',
  });
});

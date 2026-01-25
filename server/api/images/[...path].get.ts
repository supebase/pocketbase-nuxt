/**
 * @file Image Proxy Handler
 * @description 资源代理接口，支持路径规范化校验、安全过滤及缓存策略。
 */

import { normalize } from 'node:path';

export default defineEventHandler(async (event) => {
  // 1. 获取并解码路径参数
  const rawPath = getRouterParam(event, 'path');

  if (!rawPath) {
    throw createError({
      status: 400,
      message: '路径不能为空',
    });
  }

  // 解码 URL 编码（处理 %2e 等绕过手段）
  const decodedPath = decodeURIComponent(rawPath);

  // 2. 路径安全校验 (Anti-Path Traversal)
  // normalize 会将 'a/../b' 转换为 'b'，去掉多余斜杠
  const normalizedPath = normalize(decodedPath);

  // 严格检查：禁止任何跳出当前目录的尝试
  // 在 Windows/Linux 下，normalize 处理后的非法路径通常以 '..' 或系统根目录开头
  if (
    normalizedPath.startsWith('..') ||
    normalizedPath.startsWith('/') ||
    normalizedPath.startsWith('\\') ||
    normalizedPath.includes('\0') // 禁止空字节攻击
  ) {
    throw createError({
      status: 403,
      message: '非法访问：路径超限',
    });
  }

  //

  // 3. 构造后端目标 URL
  const config = useRuntimeConfig();
  const targetUrl = `${config.pocketbaseBackend}/api/files/${normalizedPath}`;

  try {
    // 4. 准备请求头（透传缓存验证头）
    const requestHeaders: Record<string, string> = {};
    const ifNoneMatch = getHeader(event, 'if-none-match');
    if (ifNoneMatch) requestHeaders['if-none-match'] = ifNoneMatch;

    // 5. 执行请求（带超时控制）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

    const response = await fetch(targetUrl, {
      headers: requestHeaders,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 6. 处理缓存协商 (304 Not Modified)
    if (response.status === 304) {
      setResponseStatus(event, 304);
      return null;
    }

    // 7. 处理错误状态
    if (!response.ok) {
      throw createError({
        status: response.status,
        message: '资源不存在或后端错误',
      });
    }

    // 8. 响应头透传与缓存策略
    const etag = response.headers.get('etag');
    const lastModified = response.headers.get('last-modified');
    const contentType = response.headers.get('content-type');

    if (etag) setResponseHeader(event, 'ETag', etag);
    if (lastModified) setResponseHeader(event, 'Last-Modified', lastModified);

    // 默认回退到 image/png，但优先使用后端返回的真实类型
    setResponseHeader(event, 'Content-Type', contentType || 'image/png');

    // 生产环境开启强缓存策略
    if (process.env.NODE_ENV === 'production') {
      // 一年长缓存 + 24小时过期校验
      setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, stale-while-revalidate=86400');
    }

    // 9. 以流的形式透传 Body（Node.js/Edge 运行时均适用）
    return response.body;
  } catch (error: any) {
    // 处理超时或其他网络错误
    if (error.name === 'AbortError') {
      throw createError({ status: 504, message: '后端请求超时' });
    }

    // console.error(`[ImageProxy Error] Path: ${normalizedPath} |`, error);

    throw createError({
      status: error.statusCode || 500,
      message: '无法加载图片资源',
    });
  }
});

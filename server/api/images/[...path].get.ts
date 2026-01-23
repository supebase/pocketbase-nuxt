/**
 * @file Image Proxy Handler
 * @description 资源代理接口，支持 PocketBase 文件透传与强力缓存策略 (ETag/304)。
 */

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path');

  // 安全前置检查：防止路径穿越攻击 (Directory Traversal)
  if (!path)
    throw createError({
      status: 400,
      message: '路径不能为空',
      statusText: 'Bad Request',
    });
  if (path.includes('..')) {
    throw createError({
      status: 403,
      message: 'Forbidden',
      statusText: 'Forbidden',
    });
  }

  const config = useRuntimeConfig();
  const targetUrl = `${config.pocketbaseBackend}/api/files/${path}`;

  try {
    // 缓存协商：透传浏览器的缓存验证头 (If-None-Match)
    const requestHeaders: Record<string, string> = {};
    const ifNoneMatch = getHeader(event, 'if-none-match');
    if (ifNoneMatch) requestHeaders['if-none-match'] = ifNoneMatch;

    const response = await fetch(targetUrl, { headers: requestHeaders });

    // 处理缓存命中 (304 Not Modified)
    // 如果后端文件未变动，直接结束请求，不下载也不传输 body
    if (response.status === 304) {
      setResponseStatus(event, 304);
      return null;
    }

    if (!response.ok) {
      throw createError({
        status: response.status,
        message: '资源不存在',
        statusText: 'Not Found',
      });
    }

    // 透传响应头：保持 ETag、Last-Modified 和 Content-Type 一致
    const etag = response.headers.get('etag');
    const lastModified = response.headers.get('last-modified');
    const contentType = response.headers.get('content-type');

    if (etag) setResponseHeader(event, 'ETag', etag);
    if (lastModified) setResponseHeader(event, 'Last-Modified', lastModified);
    if (contentType) setResponseHeader(event, 'Content-Type', contentType || 'image/png');

    // 设置浏览器长缓存策略
    if (process.env.NODE_ENV === 'production') {
      // 配合 ETag 使用，实现“过期但可用”的校验逻辑 (stale-while-revalidate)
      setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, stale-while-revalidate=86400');
    }

    // 以流的形式返回 Body，降低内存占用
    return response.body;
  } catch (error) {
    console.error('[ImageProxy] 错误:', error);
    throw createError({
      status: 404,
      message: '无法加载图片',
      statusText: 'Not Found',
    });
  }
});

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path');
  if (!path) throw createError({ statusCode: 400, message: '路径不能为空' });

  const config = useRuntimeConfig();
  const targetUrl = `${config.pocketbaseBackend}/api/files/${path}`;

  try {
    // 透传浏览器的缓存验证头 (If-None-Match) 给 PocketBase
    const requestHeaders: Record<string, string> = {};
    const ifNoneMatch = getHeader(event, 'if-none-match');
    if (ifNoneMatch) requestHeaders['if-none-match'] = ifNoneMatch;

    const response = await fetch(targetUrl, { headers: requestHeaders });

    // 💡 1. 处理 304 缓存命中
    // 如果 PocketBase 返回 304，我们也直接给浏览器 304，节省所有流量
    if (response.status === 304) {
      setResponseStatus(event, 304);
      return null;
    }

    if (!response.ok) {
      throw createError({ statusCode: response.status, message: '图片不存在' });
    }

    // 💡 2. 透传关键的缓存校验头
    const etag = response.headers.get('etag');
    const lastModified = response.headers.get('last-modified');
    const contentType = response.headers.get('content-type');

    if (etag) setResponseHeader(event, 'ETag', etag);
    if (lastModified) setResponseHeader(event, 'Last-Modified', lastModified);
    if (contentType) setResponseHeader(event, 'Content-Type', contentType);

    // 💡 3. 设置智能缓存策略
    // 对于已经有 ETag 保护的资源，我们可以放心地设置长缓存
    if (process.env.NODE_ENV === 'production') {
      // 保持 7 天或设为更长。只要 ETag 在，过期了也就是一个 304 请求的事
      setResponseHeader(
        event,
        'Cache-Control',
        'public, max-age=31536000, stale-while-revalidate=86400',
      );
    }

    if (path.includes('..')) {
      throw createError({ statusCode: 403, message: 'Forbidden' });
    }

    return response.body;
  } catch (error) {
    console.error('[ImageProxy] 代理失败:', error);
    throw createError({ statusCode: 404, message: '无法加载图片' });
  }
});

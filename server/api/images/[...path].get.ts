/**
 * 图片代理路由。
 * 现在它不再从本地磁盘读取，而是从 PocketBase 获取文件并流式传输。
 */
export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path');

  if (!path) {
    throw createError({ statusCode: 400, statusMessage: '路径不能为空' });
  }

  const config = useRuntimeConfig();

  // 拼接 PocketBase 标准的文件访问链接
  const targetUrl = `${config.pocketbaseBackend}/api/files/${path}`;

  try {
    // 1. 发起内部请求获取图片
    const response = await fetch(targetUrl);

    if (!response.ok) {
      throw createError({ statusCode: response.status, statusMessage: '图片不存在' });
    }

    // 2. 设置缓存头（PocketBase 默认也会带，这里可以根据需要覆盖）
    if (process.env.NODE_ENV === 'production') {
      setResponseHeader(event, 'Cache-Control', 'public, max-age=604800, immutable');
    }

    // 3. 转发 Content-Type (image/png, image/jpeg 等)
    const contentType = response.headers.get('content-type');
    if (contentType) {
      setResponseHeader(event, 'Content-Type', contentType);
    }

    // 4. 将图片流式返回
    return response.body;
  } catch (error) {
    console.error('[ImageProxy] 获取图片失败:', error);
    throw createError({
      statusCode: 404,
      statusMessage: '无法加载请求的图片',
    });
  }
});

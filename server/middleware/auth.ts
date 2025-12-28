/**
 * @file /server/middleware/auth.ts
 * @description 身份认证中间件 (Authentication Middleware)。
 *              该中间件会在处理受保护的 API 路由之前执行，集中处理用户身份验证逻辑。
 */

/**
 * 定义一个需要身份验证的路由和方法的列表。
 * 这使得认证逻辑与 API 路由处理程序本身分离，提高了代码的模块化和可维护性。
 */
const protectedRoutes = [
  // 文章相关
  { path: '/api/collections/posts', method: 'POST' }, // 创建文章
  { path: '/api/collections/post/', method: 'PUT' }, // 更新文章 (路径以前缀匹配)
  { path: '/api/collections/post/', method: 'DELETE' }, // 删除文章 (路径以前缀匹配)

  // 评论相关
  { path: '/api/collections/comments', method: 'POST' }, // 创建评论
  { path: '/api/collections/comment/', method: 'DELETE' }, // 删除评论 (路径以前缀匹配)

  // 点赞相关
  { path: '/api/collections/likes', method: 'POST' }, // 创建/取消点赞

  // 认证相关
  { path: '/api/auth/logout', method: 'POST' }, // 登出操作也需要用户上下文
];

export default defineEventHandler(async (event) => {
  // 1. 获取当前请求的 URL 路径和 HTTP 方法。
  const url = getRequestURL(event).pathname;
  const method = event.method;

  // 2. 检查当前请求是否匹配受保护路由列表中的任何一项。
  const isProtected = protectedRoutes.some((route) => {
    // 如果规则是前缀匹配 (例如 '/api/collections/post/')
    if (route.path.endsWith('/')) {
      return url.startsWith(route.path) && method === route.method;
    }
    // 如果是精确路径匹配
    return url === route.path && method === route.method;
  });

  // 3. 如果请求的路由不受保护，则直接跳过，不执行任何操作。
  if (!isProtected) {
    return;
  }

  // 4. 如果路由受保护，检查请求上下文中是否存在用户信息。
  //    `event.context.user` 是在 `server/plugins/auth.ts` 插件中被注入的。
  if (!event.context.user) {
    // 5. 如果用户不存在（未登录或会话无效），则抛出一个 401 Unauthorized 错误。
    //    这将立即中断请求处理流程，后续的 API 路由处理器不会被执行。
    throw createError({
      statusCode: 401,
      message: '用户未登录或会话已过期，请重新登录。',
      statusMessage: 'Unauthorized',
    });
  }

  // 6. 如果用户已登录，则不执行任何操作，请求将继续流转到相应的 API 路由处理器。
});

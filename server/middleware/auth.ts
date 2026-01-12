/**
 * @file /server/middleware/auth.ts
 * @description 身份认证中间件 (Authentication Middleware)。
 *              该中间件会在处理受保护的 API 路由之前执行，集中处理用户身份验证逻辑。
 */

/**
 * 定义一个需要身份验证的路由和方法的列表。
 * 这使得认证逻辑与 API 路由处理程序本身分离，提高了代码的模块化和可维护性。
 */
import { getPocketBase } from '../utils/pocketbase';

const protectedRoutes = [
  { path: '/api/collections/posts', method: 'POST' },
  { path: '/api/collections/post', method: ['PUT', 'DELETE'], isPrefix: true },
  { path: '/api/collections/comments', method: 'POST' },
  { path: '/api/collections/comment', method: 'DELETE', isPrefix: true },
  { path: '/api/collections/likes', method: 'POST' },
];

export default defineEventHandler(async (event) => {
  // 统一路径格式
  const url = getRequestURL(event).pathname.replace(/\/$/, '').toLowerCase() || '/';
  const method = event.method;

  // 1. 初始化 PocketBase 实例并注入 context
  const pb = getPocketBase(event);
  event.context.pb = pb;

  // 2. 身份解析与 Session 同步
  if (pb.authStore.isValid && pb.authStore.record) {
    event.context.user = pb.authStore.record;
  } else {
    // 如果 PocketBase 状态失效但 Session 还在，执行清理
    if (event.context.user) {
      await clearUserSession(event);
      event.context.user = null;
    }
  }

  // 3. 路由保护逻辑
  const isProtected = protectedRoutes.some((route) => {
    const methodMatch = Array.isArray(route.method)
      ? route.method.includes(method)
      : method === route.method;

    if (!methodMatch) return false;

    if (route.isPrefix) {
      return url === route.path || url.startsWith(`${route.path}/`);
    }
    return url === route.path;
  });

  if (isProtected && !event.context.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: '此操作需要登录',
    });
  }
});

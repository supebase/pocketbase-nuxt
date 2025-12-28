/**
 * @file /server/middleware/auth.ts
 * @description 身份认证中间件 (Authentication Middleware)。
 *              该中间件会在处理受保护的 API 路由之前执行，集中处理用户身份验证逻辑。
 */

/**
 * 定义一个需要身份验证的路由和方法的列表。
 * 这使得认证逻辑与 API 路由处理程序本身分离，提高了代码的模块化和可维护性。
 */
import { getPocketBaseInstance } from '../utils/pocketbase';

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
];

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event).pathname;
  const method = event.method;

  // 1. 无论是否是受保护路由，先尝试初始化用户信息
  // 这样 event.context.user 就能在后续的 API 处理程序中使用了
  const pb = getPocketBaseInstance(event);

  // 如果 pb.authStore 验证有效，则将用户信息注入上下文
  if (pb.authStore.isValid) {
    event.context.user = pb.authStore.record;
    // 可选：将 pb 实例也存入 context，避免后续重复创建
    event.context.pb = pb;
  }

  // 2. 检查当前请求是否匹配受保护路由
  const isProtected = protectedRoutes.some((route) => {
    if (route.path.endsWith('/')) {
      return url.startsWith(route.path) && method === route.method;
    }
    return url === route.path && method === route.method;
  });

  if (!isProtected) return;

  // 3. 此时 event.context.user 已经被前面的代码尝试赋值了
  if (!event.context.user) {
    throw createError({
      statusCode: 401,
      message: '用户未登录或会话已过期，请重新登录。',
      statusMessage: 'Unauthorized',
    });
  }
});

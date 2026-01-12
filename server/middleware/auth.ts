/**
 * @file Auth Middleware
 * @description 全局身份认证中间件。负责 PocketBase 实例初始化、用户状态同步及受保护路由的鉴权拦截。
 */

import { getPocketBase } from '../utils/pocketbase';

/** * 受保护路由配置
 * @description 定义需要登录才能访问的 API 路径及对应的方法
 */
const protectedRoutes = [
  { path: '/api/collections/posts', method: 'POST' },
  { path: '/api/collections/post', method: ['PUT', 'DELETE'], isPrefix: true },
  { path: '/api/collections/comments', method: 'POST' },
  { path: '/api/collections/comment', method: 'DELETE', isPrefix: true },
  { path: '/api/collections/likes', method: 'POST' },
];

export default defineEventHandler(async (event) => {
  // 路径标准化：移除尾部斜杠并转为小写，确保匹配一致性
  const url = getRequestURL(event).pathname.replace(/\/$/, '').toLowerCase() || '/';
  const method = event.method;

  // 实例初始化：将 PocketBase 注入 event.context 供后续 Handler 使用
  const pb = getPocketBase(event);
  event.context.pb = pb;

  // 状态同步：确保 PocketBase AuthStore 与 Nuxt Session 状态一致
  if (pb.authStore.isValid && pb.authStore.record) {
    event.context.user = pb.authStore.record;
  } else {
    // 自动降级：若 PB Token 失效则同步清理 Nuxt Session
    if (event.context.user) {
      await clearUserSession(event);
      event.context.user = null;
    }
  }

  // 拦截逻辑：检查当前请求是否命中保护路由
  const isProtected = protectedRoutes.some((route) => {
    const methodMatch = Array.isArray(route.method) ? route.method.includes(method) : method === route.method;

    if (!methodMatch) return false;

    // 前缀匹配支持（适用于 /api/comment/:id 等动态路由）
    if (route.isPrefix) {
      return url === route.path || url.startsWith(`${route.path}/`);
    }
    return url === route.path;
  });

  // 鉴权判定：若为保护路由且无有效用户，则阻断请求
  if (isProtected && !event.context.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: '此操作需要登录',
    });
  }
});

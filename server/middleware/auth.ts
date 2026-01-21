/**
 * @file Auth Middleware
 * @description 全局身份认证中间件。包含 PocketBase 实例初始化、Token 自动续期及鉴权拦截。
 */

import { getPocketBase } from '../utils/pocketbase';

/**
 * 受保护路由配置
 */
const protectedRoutes = [
  { path: '/api/collections/posts', method: 'POST' },
  { path: '/api/collections/post', method: ['PUT', 'DELETE'], isPrefix: true },
  { path: '/api/collections/comments', method: 'POST' },
  { path: '/api/collections/comment', method: 'DELETE', isPrefix: true },
  { path: '/api/collections/likes', method: 'POST' },
];

/**
 * 检查是否需要刷新 Token (时间间隔检查)
 * @description 逻辑：如果 Token 的有效时间已经过去了一半以上，则返回 true
 */
function shouldRefreshToken(token: string): boolean {
  try {
    // JWT 结构为 [header].[payload].[signature]，我们取中间的 payload
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const now = Math.floor(Date.now() / 1000);
    const totalDuration = payload.exp - payload.iat; // 总有效期
    const remaining = payload.exp - now; // 剩余有效期

    // 如果剩余寿命少于总寿命的一半，就触发刷新
    return remaining < totalDuration / 2;
  } catch (e) {
    return false;
  }
}

export default defineEventHandler(async (event) => {
  // 1. 路径标准化
  const url = getRequestURL(event).pathname.replace(/\/$/, '').toLowerCase() || '/';
  const method = event.method;

  // 2. 实例初始化
  const pb = getPocketBase(event);
  event.context.pb = pb;

  // 3. 身份验证与自动续期
  if (pb.authStore.isValid && pb.authStore.record) {
    // 检查是否需要续期 (避免高频刷新)
    if (shouldRefreshToken(pb.authStore.token)) {
      try {
        // 执行 PocketBase 官方刷新接口
        await pb.collection('users').authRefresh();

        // 重要：将刷新后的新 Token 同步回浏览器 Cookie
        const newCookie = pb.authStore.exportToCookie({
          httpOnly: false, // 允许前端 JS 读取（如果需要）
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        });
        appendResponseHeader(event, 'set-cookie', newCookie);
      } catch (e: any) {
        // 只要 PB 没明确说 Token 无效（比如 401），就不要清理 Session
        // 只有当刷新接口返回明确的身份错误时才登出
        if (e.status === 401 || e.status === 403) {
          pb.authStore.clear();
          await clearUserSession(event);
        }
      }
    }

    // 同步到 context 供 Handler 使用
    event.context.user = pb.authStore.record;
  } else {
    // 自动降级：若 PB Token 失效则同步清理 Nuxt Session
    if (event.context.user) {
      await clearUserSession(event);
      event.context.user = null;
    }
  }

  // 4. 拦截逻辑：检查当前请求是否命中保护路由
  const isProtected = protectedRoutes.some((route) => {
    const methodMatch = Array.isArray(route.method) ? route.method.includes(method) : method === route.method;

    if (!methodMatch) return false;

    if (route.isPrefix) {
      return url === route.path || url.startsWith(`${route.path}/`);
    }
    return url === route.path;
  });

  // 5. 鉴权判定
  if (isProtected && !event.context.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: '此操作需要登录',
    });
  }
});

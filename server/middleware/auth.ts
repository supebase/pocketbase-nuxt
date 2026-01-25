/**
 * @file Auth Middleware
 * @description 全局身份认证中间件。包含 PocketBase 实例初始化、Token 自动续期（防竞态）及鉴权拦截。
 */
import { Buffer } from 'node:buffer';

/**
 * 内存锁：用于合并并发的刷新请求
 * Key 为用户 ID，Value 为正在进行的刷新 Promise
 */
const refreshRequests = new Map<string, Promise<any>>();

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
 * 检查是否需要刷新 Token
 */
function shouldRefreshToken(token: string | null | undefined): boolean {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const payload = JSON.parse(Buffer.from(parts[1] || '', 'base64').toString());
    const now = Math.floor(Date.now() / 1000);

    // 如果已过期，交由 PocketBase SDK 的 isValid 处理，此处不触发刷新
    if (now >= payload.exp) return false;

    const totalDuration = payload.exp - payload.iat;
    const remaining = payload.exp - now;

    // 剩余时间小于总时长的一半时返回 true
    return remaining < totalDuration / 2;
  } catch {
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

  // 3. 身份验证与自动续期（核心修复逻辑）
  if (pb.authStore.isValid && pb.authStore.record) {
    if (shouldRefreshToken(pb.authStore.token)) {
      const userId = pb.authStore.record.id;

      try {
        // 检查是否有该用户的刷新任务正在进行
        if (!refreshRequests.has(userId)) {
          // 创建刷新任务并存入 Map
          const refreshTask = pb
            .collection('users')
            .authRefresh()
            .finally(() => {
              // 无论成功失败，短暂延迟后移除锁（给并发请求留出同步时间）
              setTimeout(() => refreshRequests.delete(userId), 1000);
            });
          refreshRequests.set(userId, refreshTask);
        }

        // 所有并发请求都会在此处阻塞，直到同一个刷新任务完成
        await refreshRequests.get(userId);

        // 重要：刷新成功后，同步最新的 Auth 状态到当前请求的 Cookie
        const newCookie = pb.authStore.exportToCookie({
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        });
        appendResponseHeader(event, 'set-cookie', newCookie);
      } catch (e: any) {
        // 只有当刷新接口明确返回身份错误（401/403）时才强制登出
        if (e.status === 401 || e.status === 403) {
          pb.authStore.clear();
          await clearUserSession(event);
        }
      }
    }

    // 将最新的用户信息注入 context
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
      status: 401,
      message: '此操作需要登录',
      statusText: 'Unauthorized',
    });
  }
});

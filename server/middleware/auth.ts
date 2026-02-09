/**
 * @file Auth Middleware
 * @description 全局身份认证中间件。处理 PocketBase Token 自动续期（防竞态）、
 * 路径大小写安全匹配及 Nuxt Context 身份注入。
 */
import { Buffer } from 'node:buffer';
import { UsersRecord } from '~/types';

/**
 * 内存锁：用于合并同一用户的并发刷新请求
 * Key: 用户 ID, Value: 正在进行的刷新 Promise
 */
const refreshRequests = new Map<string, Promise<{ token: string; record: any }>>();

/**
 * 受保护路由配置
 * 注意：path 建议使用小写，匹配时会统一转为小写比对
 */
const protectedRoutes = [
  { path: '/api/collections/posts', method: 'POST', adminOnly: true },
  { path: '/api/collections/post', method: ['PUT', 'DELETE'], isPrefix: true, adminOnly: true },
  { path: '/api/collections/comments', method: 'POST' },
  { path: '/api/collections/comment', method: 'DELETE', isPrefix: true },
  { path: '/api/collections/likes', method: 'POST' },
  { path: '/api/collections/notification', method: ['GET', 'PATCH'] },
  { path: '/api/collections/notification', method: ['PATCH', 'DELETE'], isPrefix: true },
];

/**
 * 检查是否需要刷新 Token (逻辑：剩余有效时间小于总时长的一半时触发)
 */
function shouldRefreshToken(token: string | null | undefined): boolean {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const base64Payload = parts[1] || '';
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
    const now = Math.floor(Date.now() / 1000);

    // 1. 基础检查：如果已经过期或没有过期时间，不处理（交给 SDK 报错）
    if (!payload.exp || !payload.iat) return false;

    // 2. 时钟偏差容忍度：给予 10 秒的宽限期
    // 如果现在距离过期已经不到 10 秒了，认为它已经失效
    if (now >= payload.exp - 10) return false;

    const totalDuration = payload.exp - payload.iat;
    const remaining = payload.exp - now;

    /**
     * 刷新策略：
     * - 情况 A: 距离过期时间不足 5 分钟 (300s)，必须强制刷新以应对网络延迟。
     * - 情况 B: 距离过期时间不足总时长的 50%，在低频访问时维持 Token 活性。
     */
    const MIN_BUFFER = 300;
    return remaining < MIN_BUFFER || remaining < totalDuration / 2;
  } catch {
    return false;
  }
}

export default defineEventHandler(async (event) => {
  // 1. 路径标准化处理
  // rawUrl 保留原始大小写供后续可能的请求使用
  const rawUrl = getRequestURL(event).pathname.replace(/\/$/, '') || '/';
  // matchUrl 转为小写仅用于受保护路由的逻辑匹配，防止路径绕过
  const matchUrl = rawUrl.toLowerCase();
  const method = event.method.toUpperCase();

  // 2. 初始化 PocketBase 实例
  // 确保 getPocketBase 在 SSR 环境下为每个请求返回隔离的实例
  const pb = getPocketBase(event);
  event.context.pb = pb;

  // 3. 核心：身份验证与 Token 自动续期
  if (pb.authStore.isValid && pb.authStore.record) {
    const userId = pb.authStore.record.id;

    if (shouldRefreshToken(pb.authStore.token)) {
      let isLeader = false;
      let refreshTask = refreshRequests.get(userId);

      if (!refreshTask) {
        isLeader = true;
        // 创建刷新任务
        refreshTask = pb
          .collection('users')
          .authRefresh()
          .then((authData) => ({
            token: authData.token,
            record: authData.record,
          }));

        refreshRequests.set(userId, refreshTask);
      }

      try {
        const latestAuth = await refreshTask; // 所有并发请求都会在这里等待同一个结果

        if (isLeader) {
          setTimeout(() => {
            refreshRequests.delete(userId);
          }, 2000);
        }

        pb.authStore.save(latestAuth.token, latestAuth.record);

        // 同步最新的 Auth 状态到 Response Header (Cookie)
        const newCookie = pb.authStore.exportToCookie(
          {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          },
          'pb_auth',
        );
        appendResponseHeader(event, 'set-cookie', newCookie);

        if (event.context.user) {
          await replaceUserSession(event, {
            // 明确排除 null 的情况
            user: event.context.user as any,
            pbToken: latestAuth.token,
            loggedInAt: new Date().toISOString(),
          });
        }
        // --- 并发锁控制结束 ---
      } catch (e: any) {
        if (isLeader) refreshRequests.delete(userId);
        // 如果刷新接口明确返回认证失败
        if (e.status === 401 || e.status === 403) {
          pb.authStore.clear();
          await clearUserSession(event);
        }
      }
    }

    // 注入当前有效用户信息到 context
    event.context.user = pb.authStore.record as unknown as UsersRecord;
  } else {
    // 自动降级：若 PB Token 失效则同步清理 Nuxt Session
    if (event.context.user) {
      await clearUserSession(event);
      event.context.user = null;
    }
  }

  // 4. 路由拦截逻辑
  const matchedRoute = protectedRoutes.find((route) => {
    const routeMethods = Array.isArray(route.method) ? route.method : [route.method];
    const methodMatch = routeMethods.some((m) => m.toUpperCase() === method);
    if (!methodMatch) return false;

    const targetPath = route.path.toLowerCase();
    if (route.isPrefix) {
      return matchUrl === targetPath || matchUrl.startsWith(`${targetPath}/`);
    }
    return matchUrl === targetPath;
  });

  // 5. 鉴权拦截判定
  if (matchedRoute) {
    // A. 未登录拦截
    if (!event.context.user) {
      throw createError({ status: 401, message: '请先登录' });
    }

    // B. 管理员权限拦截
    if (matchedRoute.adminOnly) {
      if (!event.context.user.is_admin) {
        throw createError({ status: 403, message: '权限不足' });
      }
    }
  }
});

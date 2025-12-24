import type { H3Event } from 'h3';
import type { UserRecord, AuthResponse } from '~/types/auth';
import type { TypedPocketBase } from '~/types/pocketbase-types';

/**
 * 统一处理认证成功逻辑
 * 核心：同时维持 Nuxt Session 和 PocketBase Cookie
 */
export async function handleAuthSuccess(
  event: H3Event,
  pb: TypedPocketBase,
  successMessage: string
): Promise<AuthResponse> {
  const pbUser = pb.authStore.model as unknown as UserRecord;

  // 1. 构造用户载荷
  const userPayload: UserRecord = {
    id: pbUser.id,
    email: pbUser.email,
    name: pbUser.name,
    avatar: pbUser.avatar,
    verified: pbUser.verified,
  };

  // 2. 设置 nuxt-auth-utils Session (使用你在 runtimeConfig 配置的 pb-session)
  await setUserSession(event, {
    user: userPayload,
    loggedInAt: new Date().toISOString(),
  });

  // 3. 将 PB Token 写入 Cookie，供客户端 SDK 和 WebSocket 使用
  // 注意：maxAge 应与 session 配置保持一致 (7天)
  const pbCookie = pb.authStore.exportToCookie({
    httpOnly: false, // 必须为 false，否则客户端 JS 无法读取 Token 供 WebSocket 使用
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });

  appendResponseHeader(event, 'Set-Cookie', pbCookie);

  return {
    message: successMessage,
    data: {
      user: userPayload,
    },
  };
}
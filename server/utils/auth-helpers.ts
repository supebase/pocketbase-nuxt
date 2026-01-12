/**
 * @file Auth Utilities
 * @description 统一处理认证成功后的逻辑，确保 Nuxt Session 与 PocketBase Cookie 状态同步。
 */

import type { H3Event } from 'h3';
import type { TypedPocketBase } from '~/types/pocketbase-types';
import type { UserRecord, AuthResponse } from '~/types/auth';
import { MAX_COOKIE_AGE } from '~/constants';

/**
 * 认证成功统一处理
 * @description 主要任务：1. 更新加密的 Nuxt Session；2. 导出 PocketBase 认证 Cookie；3. 返回脱敏后的用户信息。
 * @param pb 已经通过 authWithPassword 等方法完成认证的实例
 */
export async function handleAuthSuccess(
  event: H3Event,
  pb: TypedPocketBase,
  successMessage: string,
): Promise<AuthResponse> {
  const pbUser = pb.authStore.record as unknown as UserRecord;

  // 构造用户载荷 (Payload)：只导出 UI 展现所需的非敏感字段
  const userPayload: UserRecord = {
    id: pbUser.id,
    email: pbUser.email,
    name: pbUser.name,
    avatar: pbUser.avatar,
    verified: pbUser.verified,
    location: pbUser.location,
  };

  // 更新服务端 Session (nuxt-auth-utils)
  // 用于 SSR 期间快速通过 getUserSession() 获取当前用户
  await setUserSession(event, {
    user: userPayload,
    loggedInAt: new Date().toISOString(),
  });

  // 导出并同步 PocketBase 认证状态至客户端 Cookie
  // 该 Cookie 供 getPocketBase(event) 在后续请求中还原 authStore
  const MAX_AGE = MAX_COOKIE_AGE;
  const pbCookie = pb.authStore.exportToCookie(
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/',
      maxAge: MAX_AGE,
    },
    'pb_auth',
  );

  appendResponseHeader(event, 'Set-Cookie', pbCookie);

  // 返回前端所需的成功报文
  return {
    message: successMessage,
    data: {
      user: userPayload,
    },
  };
}

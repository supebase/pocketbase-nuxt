import type { H3Event } from 'h3';
import type { UserRecord, AuthResponse } from '~/types/auth';

/**
 * 统一处理 PocketBase 认证成功后的会话设置和返回值
 */
export async function handleAuthSuccess(
  event: H3Event,
  pbUser: UserRecord,
  successMessage: string
): Promise<AuthResponse> {
  // 1. 构造用户载荷 (Payload)
  // 这里的结构会直接存入 Cookie，由 nuxt-auth-utils 管理
  const userPayload: UserRecord = {
    id: pbUser.id,
    email: pbUser.email,
    name: pbUser.name,
    avatar: pbUser.avatar,
    verified: pbUser.verified,
  };

  // 2. 设置 Session
  // 因为你在 types 中扩展了 #auth-utils，这里的 userPayload 会完美匹配 User 类型
  await setUserSession(event, {
    user: userPayload,
    loggedInAt: new Date().toISOString(), // 可选：记录登录时间
  });

  // 3. 返回符合 AuthResponse 接口的对象
  return {
    message: successMessage,
    data: {
      user: userPayload,
    },
  };
}

import type { H3Event } from "h3";
// 从类型文件中导入用户记录类型
import type { UserRecord } from "~/types/auth";

/**
 * 统一处理 PocketBase 认证成功后的会话设置和返回值
 * @param event H3Event 对象
 * @param pbUser PocketBase 的用户记录
 * @param successMessage 成功的消息
 * @returns 包含成功消息和用户信息的对象
 */
export async function handleAuthSuccess(
  event: H3Event,
  pbUser: UserRecord,
  successMessage: string
) {
  // 构造用户载荷，它会自动匹配 #auth-utils 中的 User 接口
  const userPayload = {
    id: pbUser.id,
    email: pbUser.email,
    name: pbUser.name,
    avatar: pbUser.avatar,
    verified: pbUser.verified,
  };

  // setUserSession 是 nuxt-auth-utils 提供的函数，依赖 Nuxt/Nitro 自动导入
  // 它会自动将 userPayload 视为 User 类型
  await setUserSession(event, { user: userPayload });

  return {
    message: successMessage,
    user: userPayload,
  };
}

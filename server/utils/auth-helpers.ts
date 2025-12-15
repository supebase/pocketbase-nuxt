import type { H3Event } from "h3";
// 从上面定义的类型文件中导入 PocketBase 用户记录类型
import type { PocketBaseUserRecord } from "~/types/auth.d"; // 假设路径为 ~/types/auth.d

// 移除重复定义的 interface PocketBaseUser，使用导入的类型。
// 移除 setUserSession 的模拟实现，依赖 Nuxt/Nitro 自动导入的真实 setUserSession 函数。

/**
 * 统一处理 PocketBase 认证成功后的会话设置和返回值
 * @param event H3Event
 * @param pbUser PocketBase 的用户记录（使用导入的类型）
 * @param successMessage 成功的消息
 */
export async function handleAuthSuccess(
  event: H3Event,
  pbUser: PocketBaseUserRecord, // 使用导入的类型
  successMessage: string
) {
  // 构造用户载荷，它会自动匹配 #auth-utils 中的 User 接口
  const userPayload = {
    id: pbUser.id,
    email: pbUser.email,
    name: pbUser.name,
    avatar: pbUser.avatar,
  };

  // setUserSession 是 nuxt-auth-utils 提供的函数，依赖 Nuxt/Nitro 自动导入
  // 它会自动将 userPayload 视为 User 类型
  await setUserSession(event, { user: userPayload });

  return {
    message: successMessage,
    user: userPayload,
  };
}

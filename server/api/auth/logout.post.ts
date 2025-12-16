import { logoutService } from "../../services/auth.service";

export default defineEventHandler(async (event) => {
  try {
    // 1. 清除 nuxt-auth-utils 创建的用户会话 Cookie
    await clearUserSession(event);

    // 2. 清除 PocketBase 客户端的 authStore
    await logoutService();

    return { message: "退出成功" };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: "退出失败",
    });
  }
});

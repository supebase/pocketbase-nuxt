import { logoutService } from '../../services/auth.service';

export default defineEventHandler(async (event) => {
  try {
    // 1. 清除 nuxt-auth-utils 会话
    await clearUserSession(event);

    // 2. 清除 PocketBase 客户端状态
    await logoutService();

    return { success: true, message: '退出成功' };
  } catch (error: any) {
    // 统一抛出错误格式
    throw createError({
      statusCode: error.statusCode || 500,
      // 遵循新规范：message 放详细中文，statusMessage 放简短英文
      statusMessage: 'Logout Error',
      message: '退出登录时发生错误，请稍后再试',
      data: {
        originalError: error.message,
      },
    });
  }
});

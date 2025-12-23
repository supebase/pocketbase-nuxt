import { logoutService } from '../../services/auth.service';

export default defineEventHandler(async (event) => {
  try {
    // 1. 调用 Service 清除 PocketBase 内存/状态
    // 尽管它目前是同步的，但 await 可以保证如果后续变成异步逻辑也能兼容
    await logoutService();

    // 2. 清除 nuxt-auth-utils 管理的 Cookie
    // 这步非常关键，它会移除浏览器端的所有 Session 信息
    await clearUserSession(event);

    // 3. 返回统一格式
    return {
      message: '退出登录成功',
      data: null,
    };
  } catch (error: any) {
    console.error('Logout error:', error);

    throw createError({
      statusCode: 500,
      message: '退出登录时发生异常，请重试',
      statusMessage: 'Logout Failed',
      data: {
        originalError: error.message,
      },
    });
  }
});

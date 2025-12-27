import { logoutService } from '../../services/auth.service';
import { getPocketBaseInstance } from '../../utils/pocketbase';

export default defineEventHandler(async (event) => {
  try {
    // 1. 获取当前请求的 pb 实例
    const pb = getPocketBaseInstance(event);

    // 2. 调用 Service (传入 pb 实例)
    // 这一步清理了 pb 内存中的 authStore 状态
    await logoutService(pb);

    // 3. 清除 nuxt-auth-utils 管理的 Cookie (pb-session)
    await clearUserSession(event);

    // 4. 关键：清除 PocketBase 存储在客户端的 Cookie (pb_auth)
    // 因为这套 Cookie 是我们手动通过 appendResponseHeader 写入的，
    // 所以需要手动通过 deleteCookie 移除。
    deleteCookie(event, 'pb_auth', {
      path: '/',
    });

    return {
      message: '退出登录成功',
      data: null,
    };
  } catch (error: any) {
    console.error('Logout error:', error);

    throw createError({
      statusCode: 500,
      message: '退出登录时发生异常，请重试',
    });
  }
});

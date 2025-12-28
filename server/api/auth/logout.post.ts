/**
 * @file API Route: /api/auth/logout [POST]
 * @description 用户登出的 API 端点。
 *              该接口负责清理所有与用户会话相关的状态，包括服务端的 Session 和客户端的 Cookies。
 */

// 导入登出服务，该服务会清理 PocketBase 实例内存中的认证信息。
import { logoutService } from '../../services/auth.service';
// 导入用于获取当前请求唯一的 PocketBase 实例的函数。
import { getPocketBaseInstance } from '../../utils/pocketbase';

/**
 * 定义处理用户登出请求的事件处理器。
 */
export default defineEventHandler(async (event) => {
  try {
    // 步骤 1: 获取当前请求的 PocketBase 实例。
    // 尽管登出操作不需要向 PocketBase 后端发送认证请求，
    // 但遵循统一的模式，并调用 `logoutService` 来清理实例内存是一种好的实践。
    const pb = getPocketBaseInstance(event);

    // 步骤 2: 调用服务层的 `logoutService`。
    // 这一步的主要作用是清除当前 `pb` 实例内存中的 `authStore` 状态。
    // 这是一个无状态的操作，本身不影响客户端。
    await logoutService(pb);

    // 步骤 3: 清除由 `nuxt-auth-utils` 管理的服务端 Session。
    // `clearUserSession` 会找到名为 `pb-session` (或你在配置中自定义的名称) 的 Cookie 并使其失效。
    // 这是实现服务端状态登出的关键。
    await clearUserSession(event);

    // 步骤 4: **关键步骤** - 清除 PocketBase 存储在客户端的认证 Cookie。
    // 在登录时，我们手动通过 `appendResponseHeader` 将 `pb_auth` Cookie 写入了客户端。
    // 因此，在登出时，我们也必须手动通过 `deleteCookie` 将其从浏览器中移除。
    // 如果不执行这一步，客户端的 PocketBase JS SDK 可能会因为仍然持有有效的 Token 而保持登录状态。
    deleteCookie(event, 'pb_auth', {
      // `path: '/'` 必须与设置 Cookie 时的 `path` 保持一致，以确保能成功删除。
      path: '/',
    });

    // 返回一个标准的成功响应。
    return {
      message: '退出登录成功',
      data: null,
    };
  } catch (error: any) {
    // 如果在上述任一步骤中发生意外错误，进行日志记录和标准错误响应。
    console.error('Logout error:', error);

    throw createError({
      statusCode: 500,
      message: '退出登录时发生异常，请重试',
    });
  }
});

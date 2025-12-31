/**
 * @file API Route: /api/auth/logout [POST]
 * @description 用户登出的 API 端点。
 *              该接口负责清理所有与用户会话相关的状态，包括服务端的 Session 和客户端的 Cookies。
 */

// 导入登出服务，该服务会清理 PocketBase 实例内存中的认证信息。
import { logoutService } from '../../services/auth.service';
// 导入用于获取当前请求唯一的 PocketBase 实例的函数。
import { getPocketBase } from '../../utils/pocketbase';

/**
 * 定义处理用户登出请求的事件处理器。
 */
export default defineEventHandler(async (event) => {
  try {
    // 步骤 1: 获取当前请求的 PocketBase 实例。
    // 尽管登出操作不需要向 PocketBase 后端发送认证请求，
    // 但遵循统一的模式，并调用 `logoutService` 来清理实例内存是一种好的实践。
    const pb = getPocketBase(event);

    // 步骤 2: 调用服务层的 `logoutService`。
    // 这一步的主要作用是清除当前 `pb` 实例内存中的 `authStore` 状态。
    // 这是一个无状态的操作，本身不影响客户端。
    await logoutService(event, pb);

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

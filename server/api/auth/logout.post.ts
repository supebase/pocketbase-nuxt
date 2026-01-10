/**
 * @file API Route: /api/auth/logout [POST]
 * @description 用户登出的 API 端点。
 *              该接口负责清理所有与用户会话相关的状态，包括服务端的 Session 和客户端的 Cookies。
 */
import { getPocketBase } from '../../utils/pocketbase';
import { defineApiHandler } from '~~/server/utils/api-wrapper';

/**
 * 定义处理用户登出请求的事件处理器。
 */
export default defineApiHandler(async (event) => {
  // 步骤 1: 获取当前请求的 PocketBase 实例。
  // 尽管登出操作不需要向 PocketBase 后端发送认证请求，
  // 但遵循统一的模式，并调用 `logoutService` 来清理实例内存是一种好的实践。
  const pb = getPocketBase(event);

  // 步骤 2: 调用服务层的 `logoutService`。
  // 这一步的主要作用是清除当前 `pb` 实例内存中的 `authStore` 状态。
  // 这是一个无状态的操作，本身不影响客户端。
  await logoutService(event, pb);

  return {
    message: '退出登录成功',
    data: null,
  };
});

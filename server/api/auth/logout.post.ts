/**
 * @file API Route: /api/auth/logout [POST]
 * @description 用户登出。清理认证持久化状态（Session/Cookie）并重置 PocketBase 内存实例。
 */
import { getPocketBase } from '../../utils/pocketbase';
import { defineApiHandler } from '~~/server/utils/api-wrapper';

export default defineApiHandler(async (event) => {
  // 初始化当前请求的 PocketBase 实例
  const pb = getPocketBase(event);

  /**
   * 执行登出服务逻辑
   * logoutService 内部职责：
   * - 调用 pb.authStore.clear()：清理服务端实例内存中的 Token。
   * - 清理 Session：移除 Nuxt Session 中的用户信息。
   * - 擦除 Cookie：通过 setCookie 设置过期时间为 0，强制浏览器删除身份标识。
   */
  await logoutService({ event, pb });

  return {
    message: '退出登录成功',
    data: null,
  };
});

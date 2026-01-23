/**
 * @file API Route: /api/auth/login [POST]
 * @description 用户登录。验证凭证并同步 PocketBase 认证状态至 Nuxt Session。
 */
import type { LoginRequest, AuthResponse } from '~/types/auth';

export default defineApiHandler(async (event): Promise<AuthResponse> => {
  // 请求体解析与初步校验
  const body = await readBody<LoginRequest>(event);
  const { email, password } = body;

  if (!email || !password) {
    throw createError({
      status: 400,
      message: '请输入电子邮件和登录密码',
      statusText: 'Bad Request',
    });
  }

  // 初始化 PocketBase
  // 为当前请求获取独立的 PB 实例，确保并发请求间的状态隔离
  const pb = getPocketBase(event);

  /**
   * 执行认证服务
   * loginService 内部应调用 pb.collection('users').authWithPassword()
   * 成功后，pb 实例的 authStore 将自动填充 Token 和用户信息
   */
  await loginService({ pb, email, password });

  /**
   * 认证后续处理与响应
   * handleAuthSuccess 负责将 pb.authStore 同步到 event.context.user、
   * 写入加密 Cookie 以及 Session，并返回标准化的 AuthResponse
   */
  return await handleAuthSuccess(event, pb, '登录成功');
});

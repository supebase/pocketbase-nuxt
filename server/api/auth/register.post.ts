/**
 * @file API Route: /api/auth/register [POST]
 * @description 用户注册接口。实现新用户创建、自动身份验证同步及会话持久化。
 */
import type { RegisterRequest, AuthResponse } from '~/types';

export default defineApiHandler(async (event): Promise<AuthResponse> => {
  // 请求体解构
  const body = await readBody<RegisterRequest>(event);
  const { email, password, passwordConfirm, location } = body;

  // 基础业务规则校验 (卫语句)
  if (!email || !password || !passwordConfirm) {
    throw createError({
      status: 400,
      message: '请填写完整的注册信息',
      statusText: 'Bad Request',
    });
  }

  if (password !== passwordConfirm) {
    throw createError({
      status: 400,
      message: '两次输入的密码不一致',
      statusText: 'Bad Request',
    });
  }

  // 初始化独立的 PocketBase 实例
  const pb = getPocketBase(event);

  /**
   * 执行注册与自动登录联动服务
   * registerService 内部逻辑：
   * - 向 PocketBase 提交 create 请求创建用户记录。
   * - 立即调用 authWithPassword 进行登录，使当前 pb.authStore 获得 Token。
   * - 处理可能存在的 location 或初始个人资料 (profile) 字段。
   */
  await registerService({ pb, email, password, passwordConfirm, location });

  /**
   * 会话持久化
   * 即使是新注册的用户，也通过 handleAuthSuccess 统一种植 Cookie 并更新 Session。
   */
  return await handleAuthSuccess(event, pb, '注册成功');
});

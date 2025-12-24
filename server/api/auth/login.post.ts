import { loginService } from '../../services/auth.service';
import { handlePocketBaseError } from '../../utils/errorHandler';
import { handleAuthSuccess } from '../../utils/authHelpers';
import { getPocketBaseInstance } from '../../utils/pocketbase'; // 导入获取实例的函数
import type { LoginRequest, AuthResponse } from '~/types/auth';

export default defineEventHandler(async (event): Promise<AuthResponse> => {
  const body = await readBody<LoginRequest>(event);
  const { email, password } = body;

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      message: '请输入电子邮件和登录密码',
      statusMessage: 'Invalid Input',
    });
  }

  // 1. 获取本次请求专用的独立 PB 实例
  const pb = getPocketBaseInstance(event);

  try {
    // 2. 调用 Service 并传入 pb 实例
    // 执行完这一步，pb.authStore 已经填充了当前用户的 Token 和 Model
    await loginService(pb, email, password);

    // 3. 将 pb 实例传递给 handleAuthSuccess
    // 内部会同时处理 setUserSession (nuxt-auth-utils) 和导出 pb_auth Cookie
    return await handleAuthSuccess(event, pb, '登录成功');

  } catch (error) {
    // 4. 错误处理
    return handlePocketBaseError(error, '登录失败，请检查账号信息是否正确');
  }
});
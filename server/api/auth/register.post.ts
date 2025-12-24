import { registerService } from '../../services/auth.service';
import { handlePocketBaseError } from '../../utils/errorHandler';
import { handleAuthSuccess } from '../../utils/authHelpers';
import { getPocketBaseInstance } from '../../utils/pocketbase'; // 引入获取实例的工具
import type { RegisterRequest, AuthResponse } from '~/types/auth';

export default defineEventHandler(async (event): Promise<AuthResponse> => {
  // 1. 获取并标注请求体类型
  const body = await readBody<RegisterRequest>(event);
  const { email, password, passwordConfirm } = body;

  // 2. 前置参数校验
  if (!email || !password || !passwordConfirm) {
    throw createError({
      statusCode: 400,
      message: '请填写完整的注册信息',
      statusMessage: 'Incomplete Information',
    });
  }

  if (password !== passwordConfirm) {
    throw createError({
      statusCode: 400,
      message: '两次输入的密码不一致',
      statusMessage: 'Validation Error',
    });
  }

  // 3. 获取本次请求专用的独立 PB 实例
  const pb = getPocketBaseInstance(event);

  try {
    // 4. 执行注册逻辑 (传入 pb 实例)
    // registerService 内部会调用 pb.collection('users').create() 
    // 然后紧接着调用 loginService(pb, ...)，使该 pb 实例获得 Token
    await registerService(pb, email, password, passwordConfirm);

    // 5. 统一处理成功逻辑并持久化 Session
    // 传入 pb 实例，handleAuthSuccess 会从 pb.authStore 中提取用户信息和 Token
    return await handleAuthSuccess(event, pb, '注册成功');
  } catch (error) {
    // 6. 处理 PocketBase 错误
    return handlePocketBaseError(error, '注册失败，请稍后再试');
  }
});
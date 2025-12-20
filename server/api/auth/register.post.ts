import { registerService } from '../../services/auth.service';
import { handlePocketBaseError } from '../../utils/errorHandler';
import { handleAuthSuccess } from '../../utils/authHelpers';
import type { RegisterRequest } from '~/types/auth';

export default defineEventHandler(async (event) => {
  // 1. 获取并解构请求体
  const body = await readBody<RegisterRequest>(event);
  const { email, password, passwordConfirm } = body;

  // 2. 前置参数校验 (将 statusMessage 改为 message)
  if (!email || !password || !passwordConfirm) {
    throw createError({
      statusCode: 400,
      message: '请填写完整的注册信息', // 这里放用户看到的中文
      statusMessage: 'Bad Request', // 这里放简短英文
    });
  }

  if (password !== passwordConfirm) {
    throw createError({
      statusCode: 400,
      message: '两次输入的密码不一致',
      statusMessage: 'Validation Failed',
    });
  }

  try {
    // 3. 执行注册逻辑 (内部应包含 pb.collection('users').create(...) 和 authWithPassword)
    const pbUser = await registerService(email, password, passwordConfirm);

    // 4. 统一处理成功逻辑
    // 这里的 handleAuthSuccess 会返回符合 AuthResponse 定义的 { message, data: { user } }
    return handleAuthSuccess(event, pbUser, '注册成功，欢迎加入！');
  } catch (error) {
    // 5. 统一处理 PocketBase 抛出的错误
    // 如果是邮箱已存在等 PB 错误，这里会解析并抛出友好的中文 message
    handlePocketBaseError(error, '注册失败，请检查您的输入。');
  }
});

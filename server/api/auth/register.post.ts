import { registerService } from '../../services/auth.service';
import { handlePocketBaseError } from '../../utils/errorHandler';
import { handleAuthSuccess } from '../../utils/authHelpers';
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

  // 这里的校验逻辑与 FIELD_ERROR_CODE_MAP 中的 "Values don't match." 呼应
  if (password !== passwordConfirm) {
    throw createError({
      statusCode: 400,
      message: '两次输入的密码不一致',
      statusMessage: 'Validation Error',
    });
  }

  try {
    // 3. 执行注册逻辑
    // registerService 内部处理了 email 归一化、MD5 头像和默认用户名生成
    // 返回值已在 Service 层被标注为 UsersResponse
    const pbUser = await registerService(email, password, passwordConfirm);

    // 4. 统一处理成功逻辑并持久化 Session
    // 这里的 pbUser 会被 Pick 出 UserRecord 所需字段存入 Cookie
    return await handleAuthSuccess(event, pbUser, '注册成功，欢迎加入！');
  } catch (error) {
    // 5. 处理 PocketBase 错误
    // handlePocketBaseError 会捕获“邮箱已存在(200/400)”、“密码太短”等 PB 特有异常
    // 并根据 FIELD_ERROR_CODE_MAP 转换为中文提示
    return handlePocketBaseError(error, '注册失败，请稍后再试');
  }
});

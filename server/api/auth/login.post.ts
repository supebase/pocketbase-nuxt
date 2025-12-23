import { loginService } from '../../services/auth.service';
import { handlePocketBaseError } from '../../utils/errorHandler';
import { handleAuthSuccess } from '../../utils/authHelpers';
import type { LoginRequest, AuthResponse } from '~/types/auth';

export default defineEventHandler(async (event): Promise<AuthResponse> => {
  // 1. 获取并标注输入类型
  const body = await readBody<LoginRequest>(event);
  const { email, password } = body;

  // 2. 基础校验
  if (!email || !password) {
    throw createError({
      statusCode: 400,
      message: '请输入电子邮件和登录密码',
      // statusMessage 建议保持英文简述，message 放置中文提示
      statusMessage: 'Invalid Input',
    });
  }

  try {
    // 3. 调用 Service (现在返回的是强类型的 UsersResponse)
    const pbUser = await loginService(email, password);

    // 4. 使用辅助函数处理 Session 持久化并返回
    // handleAuthSuccess 内部会自动过滤敏感字段并匹配 AuthResponse 格式
    return await handleAuthSuccess(event, pbUser, '登录成功');
  } catch (error) {
    // 5. 错误捕获
    // handlePocketBaseError 内部会根据 error.status 自动识别 401/404 等并抛出对应中文
    return handlePocketBaseError(error, '登录失败，请检查账号信息');
  }
});

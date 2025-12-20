import { loginService } from '../../services/auth.service';
import { handlePocketBaseError } from '../../utils/errorHandler';
import { handleAuthSuccess } from '../../utils/authHelpers';

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event);

  // --- 修改点：校验失败的错误处理 ---
  if (!email || !password) {
    throw createError({
      statusCode: 400,
      // 使用 message 代替 statusMessage 以消除警告
      message: '请输入电子邮件和登录密码',
      statusMessage: 'Bad Request',
    });
  }

  try {
    const pbUser = await loginService(email, password);

    // 使用辅助函数处理成功逻辑
    return handleAuthSuccess(event, pbUser, '登录成功');
  } catch (error) {
    // 这里的 handlePocketBaseError 内部已经按照我们之前的优化改成了抛出 message
    handlePocketBaseError(error, '电子邮件或登录密码错误');
  }
});

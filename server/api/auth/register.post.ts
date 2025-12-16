import { registerService } from "../../services/auth.service";
import { handlePocketBaseError } from "../../utils/errorHandler";
import { handleAuthSuccess } from "../../utils/authHelpers";

export default defineEventHandler(async (event) => {
  const { email, password, passwordConfirm } = await readBody(event);

  if (!email || !password || !passwordConfirm) {
    throw createError({
      statusCode: 400,
      statusMessage: "请填写完整的注册信息",
    });
  }

  if (password !== passwordConfirm) {
    throw createError({
      statusCode: 400,
      statusMessage: "两次输入的密码不一致",
    });
  }

  try {
    const pbUser = await registerService(email, password, passwordConfirm);

    // 使用辅助函数处理成功逻辑
    return handleAuthSuccess(event, pbUser, "注册成功");
  } catch (error) {
    handlePocketBaseError(error, "注册失败");
  }
});

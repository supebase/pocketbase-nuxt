import { pb } from "../../utils/pocketbase";
import { handlePocketBaseError } from "../../utils/errorHandler";
import { handleAuthSuccess } from "../../utils/authHelpers";

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event);

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: "请输入邮箱和密码",
    });
  }

  try {
    const authData = await pb.collection("users").authWithPassword(email, password);
    const pbUser = authData.record;

    // 使用辅助函数处理成功逻辑
    // pbUser 的类型现在是 PocketBaseUserRecord，自动传入 handleAuthSuccess
    return handleAuthSuccess(event, pbUser, "登录成功");
  } catch (error) {
    handlePocketBaseError(error, "邮箱或密码错误");
  }
});
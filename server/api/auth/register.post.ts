// register.post.ts
import { pb, getMd5Hash } from "../../utils/pocketbase";
import { handlePocketBaseError } from "../../utils/error-handler";
import { handleAuthSuccess } from "../../utils/auth-helpers";

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

  const md5Hash = getMd5Hash(email);
  // 假设新用户注册时，默认 name 为 email 或其他值
  const defaultName = email.split("@")[0];

  try {
    await pb.collection("users").create({
      email,
      password,
      passwordConfirm,
      avatar: md5Hash,
      name: defaultName, // 确保 name 字段有值
    });

    const authData = await pb.collection("users").authWithPassword(email, password);
    const pbUser = authData.record;

    // 使用辅助函数处理成功逻辑
    return handleAuthSuccess(event, pbUser, "注册成功");
  } catch (error) {
    handlePocketBaseError(error, "注册失败");
  }
});

import { pb } from "../../utils/pocketbase";
import { handlePocketBaseError } from "../../utils/errorHandler";

export default defineEventHandler(async (event) => {
  // 获取当前登录用户
  const session = await getUserSession(event);
  const user = session?.user;

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "请先登录",
    });
  }

  // 读取请求体
  const { comment, post } = await readBody(event);

  // 参数验证
  if (!comment || typeof comment !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "评论内容不能为空",
    });
  }

  // 内容长度限制（可根据实际需求调整）
  if (comment.length < 1 || comment.length > 300) {
    throw createError({
      statusCode: 400,
      statusMessage: "评论内容长度需在1-300字符之间",
    });
  }

  try {
    // 创建评论记录
    const comments = await pb.collection("comments").create({
      comment: comment,
      post: post, // 关联贴文
      user: user.id, // 关联当前登录用户
    }, { expand: "user" }); // 添加expand参数，确保返回用户信息

    return {
      message: "评论发布成功",
      comments,
    };
  } catch (error) {
    handlePocketBaseError(error, "评论发布失败");
  }
});

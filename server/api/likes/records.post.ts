import { toggleLike } from "../../services/likes.service";
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
  const { comment: commentId } = await readBody(event);

  // 参数验证
  if (!commentId || typeof commentId !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "评论ID不能为空",
    });
  }

  try {
    // 切换点赞状态
    const result = await toggleLike(commentId, user.id);

    return {
      message: result.liked ? "点赞成功" : "取消点赞成功",
      data: result,
    };
  } catch (error) {
    handlePocketBaseError(error, "点赞操作失败");
  }
});
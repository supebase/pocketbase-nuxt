import { getCommentsLikesMap } from "../../services/likes.service";
import { handlePocketBaseError } from "../../utils/errorHandler";

export default defineEventHandler(async (event) => {
  // 获取当前登录用户（可选）
  let userId = "";
  try {
    const session = await getUserSession(event);
    const user = session?.user;
    if (user) {
      userId = user.id;
    }
  } catch (error) {
    // 用户未登录时不报错，继续执行
  }

  // 获取查询参数
  const query = getQuery(event);
  const commentIdsStr = query.commentIds as string;

  // 参数验证
  if (!commentIdsStr || typeof commentIdsStr !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "评论ID列表不能为空",
    });
  }

  // 解析评论ID列表
  let commentIds: string[] = [];
  try {
    commentIds = JSON.parse(commentIdsStr);
    if (!Array.isArray(commentIds)) {
      throw new Error("commentIds must be an array");
    }
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: "评论ID列表格式错误",
    });
  }

  try {
    // 批量获取评论点赞信息
    const likesMap = await getCommentsLikesMap(commentIds, userId);

    return {
      message: "获取评论点赞信息成功",
      data: {
        likesMap,
      },
    };
  } catch (error) {
    handlePocketBaseError(error, "获取评论点赞信息失败");
  }
});
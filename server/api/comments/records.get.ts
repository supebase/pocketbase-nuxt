import { getCommentsList } from "../../services/comments.service";
import { handlePocketBaseError } from "../../utils/errorHandler";

export default defineEventHandler(async (event) => {
  try {
    // 获取查询参数
    const { filter } = getQuery(event);

    // 使用服务层函数获取评论列表
    const {
      items: comments,
      totalItems,
      page,
      perPage,
    } = await getCommentsList(1, 20, filter as string | undefined);

    return {
      message: "获取评论列表成功",
      data: {
        comments,
        totalItems,
        page,
        perPage,
      },
    };
  } catch (error) {
    handlePocketBaseError(error, "获取评论列表失败");
  }
});

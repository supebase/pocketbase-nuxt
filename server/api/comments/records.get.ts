import { getCommentsList } from "../../services/comments.service";
import { handlePocketBaseError } from "../../utils/errorHandler";

export default defineEventHandler(async (event) => {
  try {
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
    const { filter } = getQuery(event);

    // 使用服务层函数获取评论列表，传递userId以获取点赞信息
    const {
      items: comments,
      totalItems,
      page,
      perPage,
    } = await getCommentsList(1, 20, filter as string | undefined, userId);

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

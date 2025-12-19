import { getCommentsList } from "../../services/comments.service";
import { handlePocketBaseError } from "../../utils/errorHandler";

export default defineEventHandler(async (event) => {
  try {
    let userId = "";
    try {
      const session = await getUserSession(event);
      if (session?.user) {
        userId = session.user.id;
      }
    } catch (error) { }

    // 1. 从查询参数中获取 page 和 perPage
    const query = getQuery(event);

    // 转换为数字，并设置默认值
    const page = Number(query.page) || 1;
    const perPage = Number(query.perPage) || 10;
    const filter = query.filter as string | undefined;

    // 2. 将动态参数传给服务层
    const {
      items: comments,
      totalItems,
      page: currentPage,
      perPage: currentPerPage,
    } = await getCommentsList(page, perPage, filter, userId);

    return {
      message: "获取评论列表成功",
      data: {
        comments,
        totalItems,
        page: currentPage,
        perPage: currentPerPage,
      },
    };
  } catch (error) {
    handlePocketBaseError(error, "获取评论列表失败");
  }
});
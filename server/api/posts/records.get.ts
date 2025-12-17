import { getPostsList } from "../../services/posts.service";
import { handlePocketBaseError } from "../../utils/errorHandler";

export default defineEventHandler(async (event) => {
  try {
    // 1. 获取请求的查询参数
    const query = getQuery(event);

    // 2. 提取 page 参数，确保它是数字，如果不存在或无效，默认为 1
    const requestedPage = parseInt(query.page as string) || 1;
    const perPageLimit = parseInt(query.perPage as string) || 10; // 也可以从查询中获取 perPage，如果需要

    // 3. 将动态页码传递给服务层函数
    const {
      items: posts,
      totalItems,
      page,
      perPage,
    } = await getPostsList(requestedPage, perPageLimit);

    return {
      message: "获取文章列表成功",
      data: {
        posts,
        totalItems,
        page,
        perPage,
      },
    };
  } catch (error) {
    handlePocketBaseError(error, "获取文章列表失败");
  }
});

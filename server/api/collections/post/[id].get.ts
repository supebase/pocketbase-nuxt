import { getPostById } from "../../../services/posts.service";
import { handlePocketBaseError } from "../../../utils/errorHandler";

export default defineEventHandler(async (event) => {
  try {
    // 1. 从事件对象中获取路由参数 (这里是文章的 ID)
    const postId = getRouterParam(event, "id");

    if (!postId) {
      // 如果没有提供 ID，返回 400 错误
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "文章 ID 缺失",
      });
    }

    // 2. 使用服务层函数获取单个 posts 记录
    const post = await getPostById(postId);

    return {
      message: "获取文章详情成功",
      data: post,
    };
  } catch (error) {
    // 3. 处理 PocketBase 错误
    handlePocketBaseError(error, "获取文章详情失败");
  }
});
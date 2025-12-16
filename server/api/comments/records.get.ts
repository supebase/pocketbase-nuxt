import { pb } from "../../utils/pocketbase";
import { handlePocketBaseError } from "../../utils/errorHandler";

export default defineEventHandler(async (event) => {
  try {
    // 获取查询参数
    const { filter } = getQuery(event);
    
    // 构建查询条件
    const queryOptions: any = {
      sort: "-created", // 按创建时间倒序
      expand: "user", // 包含关联的 user 数据
    };
    
    // 如果有 filter 参数，添加到查询条件中
    if (filter && typeof filter === "string") {
      queryOptions.filter = filter;
    }
    
    // 获取 comments 记录列表
    const {
      items: comments,
      totalItems,
      page,
      perPage,
    } = await pb.collection("comments").getList(
      1, // page
      20, // perPage，增加每页显示数量
      queryOptions
    );

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

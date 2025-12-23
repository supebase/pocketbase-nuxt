import { getPostsList } from '../../services/posts.service';
import { handlePocketBaseError } from '../../utils/errorHandler';
// 导入业务定义的响应类型
import type { PostsListResponse } from '~/types/posts';

export default defineEventHandler(async (event): Promise<PostsListResponse> => {
  try {
    const query = getQuery(event);

    // 1. 提取并校验分页参数
    const requestedPage = Math.max(1, Number(query.page) || 1);
    const perPageLimit = Math.min(100, Number(query.perPage) || 10);

    // 2. 调用服务层 (此时 getPostsList 已具备强类型 expand 提示)
    const { items, totalItems, page, perPage } = await getPostsList(requestedPage, perPageLimit);

    // 3. 返回符合 PostsResponse 结构的响应
    return {
      message: '获取内容列表成功',
      data: {
        // 此处的 items 已经过 Service 层强类型处理，包含正确的 PostRecord 结构
        posts: items as any,
        totalItems,
        page,
        perPage,
      },
    };
  } catch (error: any) {
    // 自动捕获如：数据库连接失败、集合不存在等 PB 错误
    return handlePocketBaseError(error, '获取内容列表异常');
  }
});

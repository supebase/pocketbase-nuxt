import { getPostsList } from '../../services/posts.service';
import { handlePocketBaseError } from '../../utils/errorHandler';
import { getPocketBaseInstance } from '../../utils/pocketbase'; // 💡 导入实例获取工具
// 导入业务定义的响应类型
import type { PostsListResponse } from '~/types/posts';

export default defineEventHandler(async (event): Promise<PostsListResponse> => {
  try {
    const query = getQuery(event);

    // 1. 提取并校验分页参数
    const requestedPage = Math.max(1, Number(query.page) || 1);
    const perPageLimit = Math.min(100, Number(query.perPage) || 10);

    // 2. 获取本次请求专用的独立 PB 实例 💡
    // 它会自动处理匿名或已登录状态
    const pb = getPocketBaseInstance(event);

    // 3. 调用服务层 (传入 pb 实例) 💡
    const { items, totalItems, page, perPage } = await getPostsList(
      pb,
      requestedPage,
      perPageLimit
    );

    // 4. 返回符合 PostsResponse 结构的响应
    return {
      message: '获取内容列表成功',
      data: {
        posts: items as any,
        totalItems,
        page,
        perPage,
      },
    };
  } catch (error: any) {
    return handlePocketBaseError(error, '获取内容列表异常');
  }
});

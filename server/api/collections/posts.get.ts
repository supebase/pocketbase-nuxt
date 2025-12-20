import { getPostsList } from '../../services/posts.service';
import { handlePocketBaseError } from '../../utils/errorHandler';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);

    // 1. 提取并校验分页参数
    const requestedPage = Number(query.page) || 1;
    const perPageLimit = Number(query.perPage) || 10;

    // 校验：防止传入负数或极端过大的分页请求
    if (requestedPage < 1 || perPageLimit > 100) {
      throw createError({
        statusCode: 400,
        message: '分页参数不合法',
        statusMessage: 'Bad Request',
      });
    }

    // 2. 调用服务层
    const {
      items: posts,
      totalItems,
      page,
      perPage,
    } = await getPostsList(requestedPage, perPageLimit);

    // 3. 统一返回格式
    return {
      message: '获取文章列表成功',
      data: {
        posts,
        totalItems,
        page,
        perPage,
      },
    };
  } catch (error: any) {
    handlePocketBaseError(error, '获取文章列表失败');
  }
});

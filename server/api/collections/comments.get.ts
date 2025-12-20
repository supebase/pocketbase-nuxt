import { getCommentsList } from '../../services/comments.service';
import { handlePocketBaseError } from '../../utils/errorHandler';

export default defineEventHandler(async (event) => {
  try {
    // 1. 获取用户信息 (用于判断点赞状态)
    const session = await getUserSession(event);
    const userId = session?.user?.id || '';

    // 2. 获取并解析查询参数
    const query = getQuery(event);
    const page = Number(query.page) || 1;
    const perPage = Number(query.perPage) || 10;
    const filter = query.filter as string | undefined;

    // 3. 参数合法性基本校验
    if (page < 1 || perPage > 100) {
      throw createError({
        statusCode: 400,
        message: '分页参数不合法', // 统一使用 message 存放中文
        statusMessage: 'Bad Request', // 简短英文状态
      });
    }

    // 4. 调用服务层
    const {
      items: comments,
      totalItems,
      page: currentPage,
      perPage: currentPerPage,
    } = await getCommentsList(page, perPage, filter, userId);

    // 5. 统一返回格式 { message, data }
    return {
      message: '获取评论列表成功',
      data: {
        comments,
        totalItems,
        page: currentPage,
        perPage: currentPerPage,
      },
    };
  } catch (error) {
    // 6. 统一错误处理
    handlePocketBaseError(error, '获取评论列表失败，请稍后重试');
  }
});

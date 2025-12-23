import { getCommentsList } from '../../services/comments.service';
import { handlePocketBaseError } from '../../utils/errorHandler';
// 导入业务响应类型
import type { CommentsListResponse } from '~/types/comments';

export default defineEventHandler(async (event): Promise<CommentsListResponse> => {
  try {
    // 1. 获取用户信息 (用于判断点赞状态)
    const session = await getUserSession(event);
    const userId = session?.user?.id || '';

    // 2. 获取查询参数
    const query = getQuery(event);

    // 参数纠偏：防止非法输入导致报错
    const page = Math.max(1, Number(query.page) || 1);
    const perPage = Math.min(100, Math.max(1, Number(query.perPage) || 20));

    // 3. 构建过滤条件 (通常通过 postId 获取该贴下的评论)
    const postId = query.postId as string | undefined;
    let filter = query.filter as string | undefined;

    if (postId) {
      filter = `post = "${postId}"`;
    }

    // 4. 调用服务层
    // Service 层已重构：内部会合并点赞数据并展开用户信息
    const {
      items,
      totalItems,
      page: currentPage,
      perPage: currentPerPage,
    } = await getCommentsList(page, perPage, filter, userId);

    // 5. 统一返回格式
    return {
      message: '获取评论列表成功',
      data: {
        // items 已经由 Service 层映射为符合 CommentRecord 的结构
        comments: items as any,
        totalItems,
        page: currentPage,
        perPage: currentPerPage,
      },
    };
  } catch (error) {
    // 6. 统一错误处理，解析 PocketBase 抛出的异常
    return handlePocketBaseError(error, '获取评论列表异常，请重试');
  }
});

import { getCommentsList } from '../../services/comments.service';
import { handlePocketBaseError } from '../../utils/errorHandler';
import { getPocketBaseInstance } from '../../utils/pocketbase'; // 💡 注入实例获取工具
// 导入业务响应类型
import type { CommentsListResponse } from '~/types/comments';

export default defineEventHandler(async (event): Promise<CommentsListResponse> => {
  try {
    // 1. 获取用户信息 (用于判断点赞状态)
    const session = await getUserSession(event);
    const userId = session?.user?.id || '';

    // 2. 获取查询参数
    const query = getQuery(event);

    // 参数纠偏
    const page = Math.max(1, Number(query.page) || 1);
    const perPage = Math.min(100, Math.max(1, Number(query.perPage) || 20));

    // 3. 构建过滤条件
    const postId = query.postId as string | undefined;
    let filter = query.filter as string | undefined;

    if (postId) {
      filter = `post = "${postId}"`;
    }

    // 4. 获取独立 PB 实例 💡
    // 即使是公开读取，传入 pb 也能确保 Service 层在后续执行批量点赞查询时
    // 能够正确识别当前用户，从而标记 isLiked 状态。
    const pb = getPocketBaseInstance(event);

    // 5. 调用服务层 (传入 pb 实例) 💡
    const {
      items,
      totalItems,
      page: currentPage,
      perPage: currentPerPage,
    } = await getCommentsList(pb, page, perPage, filter, userId);

    // 6. 统一返回格式
    return {
      message: '获取评论列表成功',
      data: {
        comments: items as any,
        totalItems,
        page: currentPage,
        perPage: currentPerPage,
      },
    };
  } catch (error) {
    // 7. 统一错误处理
    return handlePocketBaseError(error, '获取评论列表异常，请重试');
  }
});
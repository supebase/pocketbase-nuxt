import { getCommentsLikesMap } from '../../services/likes.service';
import { handlePocketBaseError } from '../../utils/errorHandler';
// 导入点赞相关的业务响应类型
import type { CommentLikesResponse } from '~/types/likes';

export default defineEventHandler(async (event): Promise<CommentLikesResponse> => {
  // 1. 获取用户信息 (用于判断当前用户的点赞状态)
  const session = await getUserSession(event);
  const userId = session?.user?.id || '';

  // 2. 获取查询参数 (通常是从 query 中获取序列化后的数组)
  const query = getQuery(event);
  const commentIdsStr = query.commentIds as string;

  // 3. 基础参数校验
  if (!commentIdsStr) {
    throw createError({
      statusCode: 400,
      message: '未提供有效的评论 ID 列表',
      statusMessage: 'Missing Parameters',
    });
  }

  // 4. 解析评论 ID 列表
  let commentIds: string[] = [];
  try {
    const parsed = JSON.parse(commentIdsStr);
    commentIds = Array.isArray(parsed) ? parsed.map(String) : [];

    if (commentIds.length === 0) {
      throw new Error('Empty array');
    }
  } catch (error) {
    throw createError({
      statusCode: 400,
      message: '评论 ID 列表格式解析失败，请检查参数格式',
      statusMessage: 'Invalid Format',
    });
  }

  try {
    // 5. 调用服务层批量获取数据
    // getCommentsLikesMap 已重构，返回类型为 Record<string, CommentLikeInfo>
    const likesMap = await getCommentsLikesMap(commentIds, userId);

    // 6. 统一返回标准化的业务响应对象
    return {
      message: '点赞状态获取成功',
      data: {
        likesMap,
      },
    };
  } catch (error) {
    // 自动转换 PocketBase 内部错误（如过滤器解析失败等）
    return handlePocketBaseError(error, '批量获取点赞状态异常');
  }
});

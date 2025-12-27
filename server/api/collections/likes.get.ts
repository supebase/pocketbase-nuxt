import { getCommentsLikesMap } from '../../services/likes.service';
import { handlePocketBaseError } from '../../utils/errorHandler';
import { getPocketBaseInstance } from '../../utils/pocketbase'; // 💡 注入实例获取工具
// 导入点赞相关的业务响应类型
import type { CommentLikesResponse } from '~/types/likes';

export default defineEventHandler(async (event): Promise<CommentLikesResponse> => {
  // 1. 获取用户信息 (用于判断当前用户的点赞状态)
  const session = await getUserSession(event);
  const userId = session?.user?.id || '';

  // 2. 获取查询参数
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

  // 5. 获取独立的 PB 实例 💡
  const pb = getPocketBaseInstance(event);

  try {
    // 6. 调用服务层批量获取数据 (传入 pb 实例) 💡
    const likesMap = await getCommentsLikesMap(pb, commentIds, userId);

    // 7. 统一返回标准化的业务响应对象
    return {
      message: '点赞状态获取成功',
      data: {
        likesMap,
      },
    };
  } catch (error) {
    return handlePocketBaseError(error, '批量获取点赞状态异常');
  }
});

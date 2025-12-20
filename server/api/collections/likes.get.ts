import { getCommentsLikesMap } from '../../services/likes.service';
import { handlePocketBaseError } from '../../utils/errorHandler';

export default defineEventHandler(async (event) => {
  // 1. 获取当前登录用户 (可选)
  const session = await getUserSession(event);
  const userId = session?.user?.id || '';

  // 2. 获取查询参数
  const query = getQuery(event);
  const commentIdsStr = query.commentIds as string;

  // 3. 基础非空验证
  if (!commentIdsStr) {
    throw createError({
      statusCode: 400,
      message: '请求参数缺失：评论 ID 列表', // 改为 message
      statusMessage: 'Bad Request',
    });
  }

  // 4. 解析评论 ID 列表
  let commentIds: string[] = [];
  try {
    commentIds = JSON.parse(commentIdsStr);
    if (!Array.isArray(commentIds)) {
      throw new Error();
    }
  } catch (error) {
    throw createError({
      statusCode: 400,
      message: '评论 ID 列表格式解析失败', // 改为 message
      statusMessage: 'Unprocessable Entity',
    });
  }

  try {
    // 5. 批量获取评论点赞信息 (Map 结构: { commentId: { count: number, liked: boolean } })
    const likesMap = await getCommentsLikesMap(commentIds, userId);

    // 6. 统一返回格式
    return {
      message: '点赞状态同步成功',
      data: {
        likesMap,
      },
    };
  } catch (error) {
    // handlePocketBaseError 内部会自动抛出标准的 JSON 错误体
    handlePocketBaseError(error, '获取点赞信息失败，请检查网络');
  }
});

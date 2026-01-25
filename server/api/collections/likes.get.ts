/**
 * @file API Route: /api/collections/likes [GET]
 * @description 批量查询点赞状态。支持一次性获取多个评论的点赞计数及当前用户的交互状态。
 */
import type { CommentLikesResponse } from '~/types';

export default defineApiHandler(async (event): Promise<CommentLikesResponse> => {
  const pb = event.context.pb;
  const userId = event.context.user?.id || '';

  // 提取 Query 参数
  const query = getQuery(event);
  const commentIdsStr = query.commentIds as string;

  if (!commentIdsStr) {
    throw createError({
      status: 400,
      message: '参数缺失：未提供评论 ID 列表',
      statusText: 'Bad Request',
    });
  }

  // 健壮的参数解析逻辑
  let commentIds: string[] = [];

  try {
    const parsed = JSON.parse(commentIdsStr);
    commentIds = Array.isArray(parsed) ? parsed.map(String) : [];

    if (commentIds.length === 0) throw new Error();
  } catch (error) {
    // 如果 JSON 解析失败或后续处理出错，返回 400 Bad Request。
    throw createError({
      status: 400,
      message: '格式错误：评论 ID 列表应为标准的 JSON 字符串数组',
      statusText: 'Bad Request',
    });
  }

  // 调用 Service 层执行聚合查询
  // 核心逻辑：利用数据库 In 查询减少往返次数，并组装为以 ID 为键的映射表
  const likesMap = await getCommentsLikesMap({ pb, commentIds, userId });

  // 返回标准化的状态字典
  return {
    message: '批量状态获取成功',
    data: {
      likesMap,
    },
  };
});

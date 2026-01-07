/**
 * @file API Route: /api/collections/likes [GET]
 * @description 批量获取一组评论的点赞信息的 API 端点。
 *              用于高效解决 "N+1" 查询问题，一次性返回多个评论的点赞总数和当前用户的点赞状态。
 */
import { defineApiHandler } from '~~/server/utils/api-wrapper';
import type { CommentLikesResponse } from '~/types/likes';

/**
 * 定义处理批量获取点赞信息请求的事件处理器。
 */
export default defineApiHandler(async (event): Promise<CommentLikesResponse> => {
  // 步骤 1: 获取当前用户信息。
  // 即使未登录，接口也能工作（返回公开的点赞数），但 `userId` 是区分当前用户是否点赞的关键。
  const pb = event.context.pb;
  const userId = event.context.user?.id || '';

  // 步骤 2: 从 URL 查询字符串中获取参数。
  const query = getQuery(event);
  const commentIdsStr = query.commentIds as string;

  // 步骤 3: 验证核心参数 `commentIds` 是否存在。
  if (!commentIdsStr) {
    throw createError({
      statusCode: 400,
      message: '未提供有效的评论 ID 列表',
      statusMessage: 'Missing Parameters',
    });
  }

  // 步骤 4: 解析和验证 `commentIds` 参数。
  let commentIds: string[] = [];

  try {
    // 参数应该是一个 JSON 格式的字符串数组，我们在此解析它。
    const parsed = JSON.parse(commentIdsStr);
    // 确保解析结果是一个数组，然后将所有元素转换为字符串以保证类型一致性。
    commentIds = Array.isArray(parsed) ? parsed.map(String) : [];

    // 如果解析后数组为空，也视为无效输入。
    if (commentIds.length === 0) {
      throw new Error('Empty array after parsing');
    }
  } catch (error) {
    // 如果 JSON 解析失败或后续处理出错，返回 400 Bad Request。
    throw createError({
      statusCode: 400,
      message: '评论 ID 列表格式解析失败，请检查参数格式',
      statusMessage: 'Invalid Format',
    });
  }

  // 步骤 5: 调用服务层的 `getCommentsLikesMap` 函数。
  // 传入 `pb` 实例、评论 ID 数组和当前用户 ID，服务层将完成所有复杂的数据库查询和数据组装工作。
  const likesMap = await getCommentsLikesMap(pb, commentIds, userId);

  // 步骤 6: 将服务层返回的数据组装成标准化的 API 响应。
  return {
    message: '点赞状态获取成功',
    data: {
      likesMap,
    },
  };
});

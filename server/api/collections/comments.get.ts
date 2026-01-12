/**
 * @file API Route: /api/collections/comments [GET]
 * @description 获取评论列表的 API 端点。
 *              支持分页、过滤，并能根据当前登录的用户信息，返回每条评论的点赞状态。
 */
import { getPaginationParams } from '../../utils/pagination';
import { defineApiHandler } from '~~/server/utils/api-wrapper';
import type { CommentsListResponse } from '~/types/comments';

/**
 * 定义处理获取评论列表请求的事件处理器。
 */
export default defineApiHandler(async (event): Promise<CommentsListResponse> => {
  // 尝试获取当前用户的会话信息。
  // 这个操作不会强制要求用户登录。如果用户未登录，`session` 会是 `null`。
  // 我们主要需要 `userId` 来判断后续的点赞状态。
  const pb = event.context.pb;
  const userId = event.context.user?.id || '';

  // 步骤 1: 使用工具函数提取分页参数 (评论通常默认每页 20 条)
  const { page, perPage, query } = getPaginationParams(event, {
    page: 1,
    perPage: 20,
    maxPerPage: 100,
  });

  // 步骤 2: 构建 Filter
  const postId = (query.post || query.postId) as string | undefined;
  let filter = query.filter as string | undefined;

  if (postId) {
    filter = pb.filter('post = {:postId}', { postId });
  }

  // 步骤 3: 调用服务
  const {
    items,
    totalItems,
    page: currentPage,
    perPage: currentPerPage,
  } = await getCommentsList({
    pb,
    page,
    perPage,
    filter,
    userId,
  });

  return {
    message: '获取评论列表成功',
    data: {
      comments: items as any,
      totalItems,
      page: currentPage,
      perPage: currentPerPage,
    },
  };
});

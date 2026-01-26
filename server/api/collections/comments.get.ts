/**
 * @file API Route: /api/collections/comments [GET]
 * @description 获取评论列表。在 Handler 层聚合评论内容与点赞状态（应用层解耦模式）。
 */
import type { CommentsListResponse, CommentRecord } from '~/types';

export default defineApiHandler(async (event): Promise<CommentsListResponse> => {
  const { pb, user } = event.context;
  const userId = user?.id || '';

  // 1. 解析分页与过滤参数
  const { page, perPage, query } = getPaginationParams(event, {
    page: 1,
    perPage: 20,
    maxPerPage: 100,
  });

  const postId = (query.post || query.postId) as string | undefined;

  if (!postId) {
    throw createError({
      status: 400,
      message: '参数缺失：未提供内容 ID 列表',
      statusText: 'Bad Request',
    });
  }

  const filter = pb.filter('post = {:postId}', { postId });

  // 2. 调用评论服务：仅获取基础评论数据（解耦后的 Service）
  const result = await getCommentsList({
    pb,
    page,
    perPage,
    filter,
  });

  // 3. 提取所有评论 ID
  const commentIds = result.items.map((comment) => comment.id);

  // 4. 调用点赞服务：获取这些评论的点赞状态映射表
  // 即使 userId 为空，该方法内部也会安全处理
  const likesMap = await getCommentsLikesMap({ pb, commentIds, userId });

  // 5. 数据聚合：将点赞状态注入到评论记录中
  const processedItems: CommentRecord[] = result.items.map((comment) => {
    const likeInfo = likesMap[comment.id];
    return {
      ...comment,
      // 这里的 likes 总数建议通过 PocketBase 的 View 或 Counter 字段获取
      // 目前保持逻辑一致，如果没有 View，likeInfo.likes 默认为 0
      likes: likeInfo?.likes || 0,
      isLiked: userId ? !!likeInfo?.isLiked : false,
      initialized: true,
    } as CommentRecord;
  });

  // 返回标准化的响应
  return {
    message: '获取评论列表成功',
    data: {
      comments: processedItems,
      totalItems: result.totalItems,
      page: result.page,
      perPage: result.perPage,
    },
  };
});

/**
 * @file API Route: /api/collections/likes [POST]
 * @description 评论点赞切换接口。实现“原子化”的点赞与取消点赞逻辑。
 */
import type { ToggleLikeRequest, ToggleLikeResponse } from '~/types';

export default defineApiHandler(async (event): Promise<ToggleLikeResponse> => {
  // 获取上下文环境
  // 认证逻辑已由 server/middleware/auth.ts 预处理，此处可安全获取用户状态
  const pb = event.context.pb;
  const user = event.context.user;

  // 参数提取与基础校验
  const body = await readBody<ToggleLikeRequest>(event);
  const { comment: commentId } = body;

  if (!commentId || typeof commentId !== 'string') {
    throw createError({
      status: 400,
      message: '操作失败：无效的评论 ID',
      statusText: 'Bad Request',
    });
  }

  // 执行切换逻辑 (Toggle Logic)
  // 调用 Service 层处理：检查状态 -> 增删记录 -> 更新计数 -> 返回结果
  const result = await toggleLike({ pb, commentId, userId: user.id });

  // 返回状态感知型的响应消息
  return {
    message: result.liked ? '点赞成功' : '已取消点赞',
    data: {
      liked: result.liked,
      likes: result.likes,
      commentId: result.commentId,
    },
  };
});

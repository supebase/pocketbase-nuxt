/**
 * @file API Route: /api/collections/comment/:id [DELETE]
 * @description 删除指定评论。集成所有权鉴权，防止越权操作。
 */

import { defineApiHandler } from '~~/server/utils/api-wrapper';

export default defineApiHandler(async (event): Promise<{ message: string; data: any }> => {
  const pb = event.context.pb;

  // 路由参数解析
  const commentId = getRouterParam(event, 'id');

  if (!commentId) {
    throw createError({
      statusCode: 400,
      message: '操作失败：评论 ID 缺失',
    });
  }

  /**
   * 调用 Service 层执行逻辑：
   * - 鉴权：内部应调用 ensureOwnership，确保只有评论作者本人或管理员可删除。
   * - 数据清理：执行删除，并由 PocketBase 自动维护相关的 View 统计（如 comment_stats 实时更新）。
   */
  const result = await deleteComment({ pb, commentId });

  return {
    message: '评论已成功删除',
    data: result,
  };
});

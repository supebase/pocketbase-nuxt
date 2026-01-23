/**
 * @file API Route: /api/collections/comment/:id [DELETE]
 * @description 删除指定评论。集成所有权鉴权，防止越权操作。
 */
export default defineApiHandler(async (event): Promise<{ message: string; data: any }> => {
  const pb = event.context.pb;

  // 路由参数解析
  const commentId = getRouterParam(event, 'id');

  if (!commentId) {
    throw createError({
      status: 400,
      message: '操作失败：评论 ID 缺失',
      statusText: 'Bad Request',
    });
  }

  // 调用 Service 层执行逻辑
  const result = await deleteComment({ pb, commentId });

  return {
    message: '评论已成功删除',
    data: result,
  };
});

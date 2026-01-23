/**
 * @file API Route: /api/collections/post/:id [DELETE]
 * @description 删除指定文章。集成所有权鉴权拦截，确保操作安全性。
 */
export default defineApiHandler(async (event): Promise<{ message: string; data: any }> => {
  const pb = event.context.pb;

  // 获取目标 ID
  const postId = getRouterParam(event, 'id');

  if (!postId) {
    throw createError({
      status: 400,
      message: '操作失败：删除目标 ID 缺失',
      statusText: 'Bad Request',
    });
  }

  /**
   * 调用 Service 层执行复合删除逻辑：
   * - 鉴权：内部调用 ensureOwnership，非作者本人操作将抛出 403 Forbidden。
   * - 清理：执行物理删除，PocketBase 会自动处理其关联的文件（如文章图片）的回收。
   */
  const result = await deletePost({ pb, postId });

  return {
    message: '内容已成功删除',
    data: result,
  };
});

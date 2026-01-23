/**
 * @file API Route: /api/collections/post/:id [PUT]
 * @description 更新指定文章。集成所有权校验、内容清洗及 Markdown 图片增量同步。
 */
export default defineApiHandler(async (event) => {
  const pb = event.context.pb;

  // 路由参数解析：获取目标资源 ID
  const postId = getRouterParam(event, 'id')!;

  if (!postId) {
    throw createError({
      status: 400,
      message: '无效的请求：内容 ID 缺失',
      statusText: 'Bad Request',
    });
  }

  // 读取请求负载
  const body = await readBody(event);

  // 调用 Service 层执行复合逻辑
  const updatedPost = await updatePost({ pb, postId, body });

  return {
    message: '更新成功',
    data: updatedPost,
  };
});

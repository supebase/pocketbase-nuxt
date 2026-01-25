/**
 * @file API Route: /api/collections/post/:id [GET]
 * @description 获取文章详情。集成服务端 MDC 解析、阅读量防刷统计及阅读量异步自增。
 */
import type { SinglePostResponse } from '~/types';

export default defineApiHandler(async (event): Promise<SinglePostResponse> => {
  const { pb } = event.context;
  const postId = getRouterParam(event, 'id');

  if (!postId) {
    throw createError({
      status: 400,
      message: '内容 ID 无效',
      statusText: 'Bad Request',
    });
  }

  // 1. 获取基础数据
  const post = await getPostById({ pb, postId });

  // 2. 并行/串行处理扩展逻辑
  const [mdcAst, updatedViews] = await Promise.all([
    post?.content ? getProcessedAst(post.content, postId) : Promise.resolve(null),
    handlePostViewTracking(event, post),
  ]);

  return {
    message: '获取内容详情成功',
    data: {
      ...post,
      views: updatedViews,
      mdcAst,
    },
  };
});

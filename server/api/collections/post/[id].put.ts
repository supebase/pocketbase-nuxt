/**
 * @file API Route: /api/collections/post/:id [PUT]
 * @description 更新指定 ID 内容（文章）的 API 端点。
 *              实现了严格的所有权验证和智能的部分更新逻辑。
 */
import { defineApiHandler } from '~~/server/utils/api-wrapper';

export default defineApiHandler(async (event) => {
  const pb = event.context.pb;
  const postId = getRouterParam(event, 'id')!;
  const body = await readBody(event);

  const updatedPost = await updatePost(pb, postId, body);

  return {
    message: '更新成功',
    data: updatedPost,
  };
});

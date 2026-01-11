/**
 * @file API Route: /api/collections/comment/[id] [GET]
 * @description 获取评论统计的 API 端点。
 *              支持根据评论 ID 获取具体的统计信息。
 */
import { defineApiHandler } from '~~/server/utils/api-wrapper';

export default defineApiHandler(async (event) => {
  const pb = event.context.pb;
  const postId = event.context.params?.id;

  if (!postId) throw createError({ statusCode: 400, message: 'Post ID is required' });

  try {
    const record = await pb.collection('comment_stats').getOne(postId, {
      fields: 'id,total_items,user_avatars,last_user_name',
    });
    return { message: '获取统计成功', data: record };
  } catch (e) {
    // 如果没有找到记录（通常是没评论时），返回默认结构，防止前端解析出错
    return {
      message: '暂无统计数据',
      data: { id: postId, total_items: 0, user_avatars: '', last_user_name: '' },
    };
  }
});

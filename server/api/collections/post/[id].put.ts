/**
 * @file API Route: /api/collections/post/:id [PUT]
 * @description 更新指定文章。集成所有权校验、内容清洗及 Markdown 图片增量同步。
 */

import { defineApiHandler } from '~~/server/utils/api-wrapper';

export default defineApiHandler(async (event) => {
  const pb = event.context.pb;

  // 路由参数解析：获取目标资源 ID
  const postId = getRouterParam(event, 'id')!;

  if (!postId) {
    throw createError({
      statusCode: 400,
      message: '无效的请求：内容 ID 缺失',
    });
  }

  // 读取请求负载
  const body = await readBody(event);

  /**
   * 3. 调用 Service 层执行复合逻辑：
   * - 鉴权：内部调用 ensureOwnership 验证当前用户是否有权修改。
   * - 过滤：清洗 HTML 标签，防止 XSS。
   * - 同步：解析内容，若有新远程图片则自动本地化。
   * - 持久化：更新 PocketBase 记录。
   */
  const updatedPost = await updatePost({ pb, postId, body });

  return {
    message: '更新成功',
    data: updatedPost,
  };
});

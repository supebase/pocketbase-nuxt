/**
 * @file API Route: /api/collections/post/:id [PUT]
 * @description 更新指定 ID 内容（文章）的 API 端点。
 *              实现了严格的所有权验证和智能的部分更新逻辑。
 */
import { getLinkPreview } from '~~/server/utils/graph-scraper';
import { defineApiHandler } from '~~/server/utils/api-wrapper';

export default defineApiHandler(async (event) => {
  const pb = event.context.pb;
  const postId = getRouterParam(event, 'id')!;
  const body = await readBody(event);

  // 处理 LinkCard 更新逻辑 (如果 link 变化了)
  if (body.link !== undefined) {
    const existing = await pb.collection('posts').getOne(postId);

    if (body.link === '') {
      body.link_data = '';
      body.link_image = '';
    } else if (body.link !== existing.link) {
      const preview = await getLinkPreview(body.link);

      if (preview?.image?.startsWith('http')) {
        try {
          const buf = await $fetch<ArrayBuffer>(preview.image, { responseType: 'arrayBuffer' });
          // 注意：PUT 请求中的文件更新，如果 Service 层不处理 link_image，需在此特殊处理
          // 这里我们选择直接把结果放入 body，交给 updatePost 最后的 update 调用
          const formData = new FormData();

          formData.append('link_image', new Blob([buf]), 'preview.png');
          preview.image = '';
          body.link_data = JSON.stringify(preview);

          await pb.collection('posts').update(postId, formData);
        } catch (e) {}
      }
    }
  }

  const data = await updatePost(pb, postId, body);

  return {
    message: '更新成功',
    data: data as any,
  };
});

/**
 * @file API Route: /api/collections/posts [POST]
 * @description 创建新内容（文章）的 API 端点。
 *              支持富文本、链接预览等高级功能，并执行严格的安全过滤。
 */
import { getLinkPreview } from '~~/server/utils/graph-scraper';
import { defineApiHandler } from '~~/server/utils/api-wrapper';
import type { CreatePostRequest, SinglePostResponse } from '~/types/posts';
import { CONTENT_MAX_LENGTH } from '~/constants';

export default defineApiHandler(async (event): Promise<SinglePostResponse> => {
  const { pb, user } = event.context;

  const body = await readBody<CreatePostRequest>(event);
  const { content, allow_comment, published, icon, action, link } = body;

  if (!content)
    throw createError({
      statusCode: 400,
      message: '内容不能为空',
    });

  if (content.length > CONTENT_MAX_LENGTH) {
    throw createError({
      statusCode: 400,
      message: '内容字数已达上限',
    });
  }

  const formData = new FormData();

  formData.append('user', user.id);
  formData.append('allow_comment', String(allow_comment ?? true));
  formData.append('published', String(published ?? true));

  if (icon) formData.append('icon', icon);
  if (action) formData.append('action', action);
  if (link) formData.append('link', link);

  // 处理 LinkCard (由于逻辑独立且涉及外部下载，仍可保留在 API 层或进一步移入 Service)
  if (link) {
    const preview = await getLinkPreview(link);

    if (preview?.image?.startsWith('http')) {
      try {
        const imgBuf = await $fetch<ArrayBuffer>(preview.image, { responseType: 'arrayBuffer' });

        formData.append('link_image', new Blob([imgBuf]), 'preview.png');
        preview.image = '';
      } catch (e) {}
    }

    if (preview) formData.append('link_data', JSON.stringify(preview));
  }

  const finalPost = await createPost({
    pb,
    initialData: formData,
    rawContent: content,
  });

  return {
    message: '发布成功',
    data: finalPost,
  };
});

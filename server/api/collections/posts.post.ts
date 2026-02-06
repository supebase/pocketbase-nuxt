/**
 * @file API Route: /api/collections/posts [POST]
 * @description 创建新文章。集成 LinkCard 自动抓取、图片本地化以及 Markdown 内容同步。
 */
import type { CreatePostRequest, SinglePostResponse } from '~/types';
import { CONTENT_MAX_LENGTH } from '~/constants';

export default defineApiHandler(async (event): Promise<SinglePostResponse> => {
  const { pb, user } = event.context;

  // 获取并清洗请求体
  const body = await readBody<CreatePostRequest>(event);
  const { content, allow_comment, published, poll, reactions, icon, action, link } = body;

  // 前置业务校验
  if (!content)
    throw createError({
      status: 400,
      message: '内容不能为空',
      statusText: 'Bad Request',
    });

  if (content.length > CONTENT_MAX_LENGTH) {
    throw createError({
      status: 400,
      message: '内容长度超出限制',
      statusText: 'Bad Request',
    });
  }

  // 构造 FormData (PocketBase 处理文件上传必须使用 FormData)
  const formData = new FormData();
  formData.append('user', user?.id || '');
  formData.append('allow_comment', String(allow_comment ?? true));
  formData.append('published', String(published ?? true));
  formData.append('poll', String(poll ?? false));
  formData.append('reactions', String(reactions ?? false));

  if (icon) formData.append('icon', icon);
  if (action) formData.append('action', action);
  if (link) formData.append('link', link);

  // 处理链接预览 (LinkCard) 及其图片本地化
  if (link) {
    const preview = await getLinkPreview(link);

    if (preview) {
      // 若预览包含远程图片，尝试下载并转存至 PocketBase 字段
      if (preview.image?.startsWith('http')) {
        try {
          const imgBuf = await $fetch<ArrayBuffer>(preview.image, {
            responseType: 'arrayBuffer',
            timeout: 5000,
          });
          // 将图片作为文件流附加
          formData.append('link_image', new Blob([imgBuf]), 'preview.png');
          // 清除原始 URL，后续前端将通过 pb_url 访问本地化后的图片
          preview.image = '';
        } catch (e) {
          console.warn(`[LinkPreview] 图片下载失败: ${link}`);
        }
      }
      formData.append('link_data', JSON.stringify(preview));
    }
  }

  // 调用 Service 层：执行内容创建与 Markdown 图片深度同步
  // createPost 内部会处理 processMarkdownImages 和 syncMarkdownContent
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

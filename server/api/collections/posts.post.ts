/**
 * @file API Route: /api/collections/posts [POST]
 * @description 创建新内容（文章）的 API 端点。
 *              支持富文本、链接预览等高级功能，并执行严格的安全过滤。
 */
import { handlePocketBaseError } from '../../utils/errorHandler';
import { getLinkPreview } from '~~/server/utils/graphScraper';
import { processMarkdownImages } from '~~/server/utils/markdownImages';
import sanitizeHtml from 'sanitize-html';
import type { CreatePostRequest, SinglePostResponse } from '~/types/posts';

export default defineEventHandler(async (event): Promise<SinglePostResponse> => {
  const pb = event.context.pb;
  const user = event.context.user;

  const body = await readBody<CreatePostRequest>(event);
  const { content, allow_comment, published, icon, action, link } = body;

  if (!content) throw createError({ statusCode: 400, message: '内容不能为空' });

  try {
    const formData = new FormData();
    formData.append('user', user.id);
    formData.append('allow_comment', String(allow_comment ?? true));
    formData.append('published', String(published ?? true));
    if (icon) formData.append('icon', icon);
    if (action) formData.append('action', action);
    if (link) formData.append('link', link);

    // 1. 下载图片并准备上传
    const { blobs, remoteUrls } = await processMarkdownImages(content);
    blobs.forEach((blob, i) => formData.append('markdown_images', blob, `img_${Date.now()}_${i}.png`));

    // 2. 处理 LinkCard 预览图
    let linkDataJson: any = null;
    if (link) {
      const preview = await getLinkPreview(link);
      if (preview) {
        linkDataJson = preview;
        if (preview.image?.startsWith('http')) {
          try {
            const imgBuf = await $fetch<ArrayBuffer>(preview.image, {
              responseType: 'arrayBuffer',
            });
            formData.append('link_image', new Blob([imgBuf]), 'preview.png');
            linkDataJson.image = ''; // 后端存储后前端动态拼接
          } catch (e) {
            console.error('Link图下载失败');
          }
        }
      }
    }
    if (linkDataJson) formData.append('link_data', JSON.stringify(linkDataJson));

    // 3. 第一次提交：创建记录并保存文件
    formData.append('content', content);
    const post = await pb.collection('posts').create(formData);

    // 4. 第二次更新：替换内容中的 URL 并清洗 HTML
    let finalContent = content;
    remoteUrls.forEach((url, i) => {
      const proxyUrl = `/api/images/posts/${post.id}/${post.markdown_images[i]}`;
      finalContent = finalContent.split(url).join(proxyUrl);
    });

    const cleanContent = sanitizeHtml(finalContent, {
      allowedTags: [
        ...sanitizeHtml.defaults.allowedTags,
        'img',
        'details',
        'summary',
        'h1',
        'h2',
        'span',
      ],
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
        code: ['class'],
        span: ['class'],
        div: ['class'],
      },
      transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'nofollow' }) },
    });

    const finalPost = await pb.collection('posts').update(post.id, { content: cleanContent });

    return { message: '发布成功', data: finalPost as any };
  } catch (error) {
    return handlePocketBaseError(error, '发布异常');
  }
});

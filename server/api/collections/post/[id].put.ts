/**
 * @file API Route: /api/collections/post/:id [PUT]
 * @description 更新指定 ID 内容（文章）的 API 端点。
 *              实现了严格的所有权验证和智能的部分更新逻辑。
 */
import { handlePocketBaseError } from '../../../utils/errorHandler';
import { getLinkPreview } from '~~/server/utils/graphScraper';
import { processMarkdownImages } from '~~/server/utils/markdownImages';
import sanitizeHtml from 'sanitize-html';

export default defineEventHandler(async (event) => {
  const pb = event.context.pb;
  const user = event.context.user!;
  const postId = getRouterParam(event, 'id')!;
  const body = await readBody(event);

  try {
    // 1. 获取旧数据并校验权限
    const existing = await pb.collection('posts').getOne(postId);
    if (existing.user !== user.id) throw createError({ statusCode: 403, message: '无权操作' });

    const formData = new FormData();
    let remoteUrls: string[] = [];

    // 2. 处理 Content 和图片下载
    if (body.content !== undefined) {
      const result = await processMarkdownImages(body.content);
      remoteUrls = result.remoteUrls;

      // 将新图片加入 FormData
      result.blobs.forEach((blob, i) => {
        formData.append('markdown_images', blob, `upd_${Date.now()}_${i}.png`);
      });
      // 注意：这里先不 append content，因为链接还没替换
    }

    // 3. 处理 LinkCard (保持原样)
    if (body.link !== undefined) {
      formData.append('link', body.link);
      if (body.link === '') {
        formData.append('link_data', '');
        formData.append('link_image', '');
      } else if (body.link !== existing.link) {
        const preview = await getLinkPreview(body.link);
        if (preview?.image?.startsWith('http')) {
          try {
            const buf = await $fetch<ArrayBuffer>(preview.image, { responseType: 'arrayBuffer' });
            formData.append('link_image', new Blob([buf]), 'preview.png');
            preview.image = '';
          } catch (e) {}
        }
        formData.append('link_data', JSON.stringify(preview || ''));
      }
    }

    // 4. 处理基础字段
    if (body.allow_comment !== undefined)
      formData.append('allow_comment', String(body.allow_comment));
    if (body.published !== undefined) formData.append('published', String(body.published));
    if (body.icon) formData.append('icon', body.icon);
    if (body.action) formData.append('action', body.action);

    // 5. 【关键修改】第一次更新：仅上传文件
    // 我们需要先拿到上传后的文件名，才能生成正确的代理 URL
    const uploadedRecord = await pb.collection('posts').update(postId, formData);

    // 6. 替换 URL 并清洗 HTML
    let finalContent = body.content !== undefined ? body.content : existing.content;

    if (remoteUrls.length > 0) {
      // 这里的逻辑必须极其严格：新文件在数组末尾
      const startIndex = uploadedRecord.markdown_images.length - remoteUrls.length;
      remoteUrls.forEach((url, i) => {
        const fileName = uploadedRecord.markdown_images[startIndex + i];
        const proxyUrl = `/api/images/posts/${postId}/${fileName}`;
        finalContent = finalContent.split(url).join(proxyUrl);
      });
    }

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
    });

    // 7. 【终极修复】第二次更新：仅更新内容字段
    // 💡 重点：不要传整个对象，只传 content，确保不触发文件字段的重新处理
    const finalPost = await pb.collection('posts').update(postId, {
      content: cleanContent,
    });

    return { message: '更新成功', data: finalPost as any };
  } catch (error) {
    return handlePocketBaseError(error, '更新异常');
  }
});

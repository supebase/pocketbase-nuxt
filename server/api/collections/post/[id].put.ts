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
    const existing = await pb.collection('posts').getOne(postId);
    if (existing.user !== user.id) throw createError({ statusCode: 403, message: '无权操作' });

    const formData = new FormData();
    let remoteUrls: string[] = [];

    // 1. 处理 Content 和图片下载
    if (body.content !== undefined) {
      // --- 关键修复：保留旧文件 ---
      // 根据 PocketBase 文档，必须显式提交想要保留的旧文件名
      if (existing.markdown_images && existing.markdown_images.length > 0) {
        existing.markdown_images.forEach((name: string) => {
          formData.append('markdown_images', name);
        });
      }

      const result = await processMarkdownImages(body.content);
      remoteUrls = result.remoteUrls;

      // 添加新文件
      result.blobs.forEach((blob, i) => {
        formData.append('markdown_images', blob, `upd_${Date.now()}_${i}.png`);
      });
    }

    // 2. 处理 LinkCard (保持原样)
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

    // 3. 处理基础字段
    if (body.allow_comment !== undefined)
      formData.append('allow_comment', String(body.allow_comment));
    if (body.published !== undefined) formData.append('published', String(body.published));
    if (body.icon) formData.append('icon', body.icon);
    if (body.action) formData.append('action', body.action);

    // 4. 执行第一次更新：上传新文件并维持旧文件引用
    const uploadedRecord = await pb.collection('posts').update(postId, formData);

    // 5. 替换 URL：此时 uploadedRecord.markdown_images 包含了 [旧文件..., 新文件...]
    let finalContent = body.content !== undefined ? body.content : existing.content;

    if (remoteUrls.length > 0) {
      // 这里的逻辑依然正确：新文件永远在数组末尾
      const startIndex = uploadedRecord.markdown_images.length - remoteUrls.length;
      remoteUrls.forEach((url, i) => {
        const fileName = uploadedRecord.markdown_images[startIndex + i];
        const proxyUrl = `/api/images/posts/${postId}/${fileName}`;
        finalContent = finalContent.split(url).join(proxyUrl);
      });
    }

    // 6. 安全清洗 HTML
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

    // 7. 第二次更新：仅保存内容
    const finalPost = await pb.collection('posts').update(postId, {
      content: cleanContent,
    });

    return { message: '更新成功', data: finalPost as any };
  } catch (error) {
    return handlePocketBaseError(error, '更新异常');
  }
});

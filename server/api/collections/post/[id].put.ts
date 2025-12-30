/**
 * @file API Route: /api/collections/post/:id [PUT]
 * @description 更新指定 ID 内容（文章）的 API 端点。
 *              实现了严格的所有权验证和智能的部分更新逻辑。
 */

// 导入核心的文章服务（更新和获取）。
import { updatePost, getPostById } from '../../../services/posts.service';
// 导入统一的 PocketBase 错误处理器。
import { handlePocketBaseError } from '../../../utils/errorHandler';
// 导入用于抓取链接预览的工具函数。
import { getLinkPreview } from '~~/server/utils/unfurl';
// 导入用于获取当前请求唯一的 PocketBase 实例的函数。
import { getPocketBaseInstance } from '../../../utils/pocketbase';
// 导入用于处理 Markdown 中的图片的工具函数。
import { processMarkdownImages } from '~~/server/utils/markdown';
// 导入用于清理 HTML 的库。
import sanitizeHtml from 'sanitize-html';
// 导入相关的业务类型定义。
import type { SinglePostResponse, CreatePostRequest } from '~/types/posts';
import type { Update } from '~/types/pocketbase-types';

export default defineEventHandler(async (event): Promise<SinglePostResponse> => {
  // 步骤 1: 强制进行身份验证。
  // 新增: 从事件上下文中获取用户信息
  // 认证逻辑已由中间件统一处理，此处可安全地使用非空断言 `!`。
  const user = event.context.user!;

  // 步骤 2: 获取并验证路由参数。
  const postId = getRouterParam(event, 'id');
  if (!postId) {
    throw createError({ statusCode: 400, message: '内容 ID 不能为空' });
  }

  // 步骤 3: 读取并处理请求体（作为部分更新）。
  const body = await readBody<Partial<CreatePostRequest>>(event);
  let cleanContent: string | undefined;
  let linkDataString: string | null | undefined = undefined;

  // 步骤 3.1: 如果请求体包含 `content`，则进行清理和验证。
  if (body.content !== undefined) {
    if (typeof body.content !== 'string' || body.content.trim() === '') {
      throw createError({ statusCode: 400, message: '有效内容不能为空' });
    }

    // 在编辑内容时也执行并发图片下载本地化 ---
    const localizedContent = await processMarkdownImages(body.content);

    // 使用与创建时相同的规则进行 HTML 清理，防止安全漏洞。
    cleanContent = sanitizeHtml(localizedContent, {
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
    // 可选：添加内容长度限制
    if (cleanContent.length > 10000) {
      throw createError({ statusCode: 400, message: '内容长度超出限制' });
    }
  }

  // 步骤 4: 获取 PocketBase 实例。
  const pb = getPocketBaseInstance(event);

  try {
    // 步骤 5: **核心安全校验** - 验证文章所有权。
    // 在更新之前，必须先查询一次，确保该文章属于当前操作的用户。
    const existingPost = await getPostById(pb, postId);

    if ((existingPost as any).user !== user.id) {
      // 如果文章的创建者 ID 与当前登录用户的 ID 不匹配，立即拒绝请求。
      throw createError({
        statusCode: 403,
        message: '您没有权限修改此内容',
        statusMessage: 'Forbidden',
      });
    }

    // 步骤 5.1: 智能处理链接预览。
    if (body.link !== undefined) {
      if (body.link === '') {
        // 如果传入空字符串，表示用户想删除链接，将预览数据设为 null。
        linkDataString = '';
      } else if (body.link !== (existingPost as any).link) {
        // 仅当新链接与旧链接不同时，才重新获取预览数据。
        const preview = await getLinkPreview(body.link);
        linkDataString = preview ? JSON.stringify(preview) : '';
      }
    }

    // 步骤 6: 构造一个只包含已提供字段的更新载荷 (Payload)。
    // 这种模式非常适合部分更新（PATCH-like behavior）。
    const updateData: Update<'posts'> = {
      ...(cleanContent !== undefined && { content: cleanContent }),
      ...(body.allow_comment !== undefined && { allow_comment: body.allow_comment }),
      ...(body.published !== undefined && { published: body.published }),
      ...(body.icon !== undefined && { icon: body.icon }),
      ...(body.action !== undefined && { action: body.action }),
      ...(body.link !== undefined && { link: body.link }),
      ...(linkDataString !== undefined && { link_data: linkDataString }),
    };

    // 步骤 7: 调用服务层执行更新操作。
    const post = await updatePost(pb, postId, updateData);

    return {
      message: '内容已成功更新',
      data: post as any,
    };
  } catch (error) {
    // 统一处理过程中可能发生的各种错误（如文章不存在、数据库写入失败等）。
    return handlePocketBaseError(error, '内容更新异常');
  }
});

/**
 * @file API Route: /api/collections/posts [POST]
 * @description 创建新内容（文章）的 API 端点。
 *              支持富文本、链接预览等高级功能，并执行严格的安全过滤。
 */

// 导入核心的文章创建服务。
import { createPost } from '../../services/posts.service';
// 导入统一的 PocketBase 错误处理器。
import { handlePocketBaseError } from '../../utils/errorHandler';
// 导入用于抓取链接预览的工具函数。
import { getLinkPreview } from '~~/server/utils/unfurl';
// 导入用于获取当前请求唯一的 PocketBase 实例的函数。
import { getPocketBaseInstance } from '../../utils/pocketbase';
// 导入用于清理 HTML 的库，这是实现富文本安全的关键。
import sanitizeHtml from 'sanitize-html';
// 导入相关的业务类型定义。
import type { CreatePostRequest, SinglePostResponse } from '~/types/posts';
import type { Create } from '~/types/pocketbase-types';

/**
 * 定义处理创建文章请求的事件处理器。
 */
export default defineEventHandler(async (event): Promise<SinglePostResponse> => {
  // 步骤 1: 强制进行身份验证。
  // 新增: 从事件上下文中获取用户信息
  // 认证逻辑已由 /server/middleware/auth.ts 中间件统一处理。
  // 中间件确保了 user 对象在此处必然可用，因此使用非空断言 `!` 是安全的。
  const user = event.context.user!;

  // 步骤 2: 读取请求体。
  const body = await readBody<CreatePostRequest>(event);
  const { content, allow_comment, published, icon, action, link } = body;

  // 步骤 3: 对核心内容进行基础的非空验证。
  if (!content || typeof content !== 'string') {
    throw createError({
      statusCode: 400,
      message: '发布内容不能为空',
      statusMessage: 'Bad Request',
    });
  }

  // 步骤 4: 处理链接预览 (Link Unfurling)。
  let linkDataString: string | undefined = undefined;
  if (link) {
    // 如果请求中包含了 `link` 字段，则调用 `getLinkPreview` 函数尝试获取该链接的元数据。
    const preview = await getLinkPreview(link);
    if (preview) {
      // 如果成功获取到预览信息，将其序列化为 JSON 字符串，以便存入数据库。
      linkDataString = JSON.stringify(preview);
    }
  }

  // 步骤 5: **核心安全措施** - 对富文本内容进行精细的 HTML 清理。
  const cleanContent = sanitizeHtml(content, {
    // 允许的标签：在默认允许的标签基础上，增加了图片、折叠面板、标题和 span。
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      'img', 'details', 'summary', 'h1', 'h2', 'span',
    ],
    // 允许的属性：在默认基础上，为特定标签增加了必要的属性。
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      code: ['class'], // 允许 `<code>` 标签有 class (用于语法高亮)
      span: ['class'],
      div: ['class'],
    },
    // 标签转换：这是一个非常有用的高级功能。
    // 这里我们将所有的 `<a>` 标签进行转换，自动给它们添加 `rel="nofollow"` 属性。
    // 这有助于 SEO 和安全性，防止滥用链接。
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'nofollow' }),
    },
  });

  // 步骤 6: 进行业务逻辑校验。
  // 检查经过 HTML 清理和 trim 操作后，是否还剩下有效内容。
  if (cleanContent.trim().length === 0) {
    throw createError({
      statusCode: 400,
      message: '有效内容不能为空',
    });
  }

  // 步骤 7: 获取 PocketBase 实例。
  const pb = getPocketBaseInstance(event);

  try {
    // 步骤 8: 构造符合数据库 `posts` 集合结构的 payload。
    const createData: Create<'posts'> = {
      content: cleanContent,            // 使用经过安全清理的富文本内容
      user: user.id,                    // **安全关键**：强制使用服务端的 `user.id`
      allow_comment: allow_comment ?? true, // 如果客户端未提供，默认为 true。`??` 能正确处理 `false` 值。
      published: published ?? true,     // 如果客户端未提供，默认为 true。
      icon,
      action,
      link,
      link_data: linkDataString,        // 存入序列化后的链接预览数据
    };

    // 步骤 9: 调用服务层函数来执行数据库创建操作。
    const post = await createPost(pb, createData);

    // 步骤 10: 返回标准化的成功响应。
    return {
      message: '内容发布成功',
      data: post as any,
    };
  } catch (error) {
    // 步骤 11: 统一处理创建过程中可能发生的任何错误。
    return handlePocketBaseError(error, '内容发布异常，请稍后再试');
  }
});

import { updatePost, getPostById } from '../../../services/posts.service';
import { handlePocketBaseError } from '../../../utils/errorHandler';
import { getLinkPreview } from '~~/server/utils/unfurl';
import { getPocketBaseInstance } from '../../../utils/pocketbase'; // 💡 注入实例获取工具
import sanitizeHtml from 'sanitize-html';
// 导入业务类型
import type { SinglePostResponse, CreatePostRequest } from '~/types/posts';
import type { Update } from '~/types/pocketbase-types';

export default defineEventHandler(async (event): Promise<SinglePostResponse> => {
  // 1. 身份校验 (Nuxt Session)
  const session = await getUserSession(event);
  const user = session?.user;

  if (!user?.id) {
    throw createError({
      statusCode: 401,
      message: '请先登录后再进行操作',
      statusMessage: 'Unauthorized',
    });
  }

  // 2. 获取参数
  const postId = getRouterParam(event, 'id');
  if (!postId) {
    throw createError({
      statusCode: 400,
      message: '内容 ID 不能为空',
    });
  }

  // 3. 读取并处理请求体
  const body = await readBody<Partial<CreatePostRequest>>(event);
  let cleanContent: string | undefined;
  let linkPreviewData: any = undefined;

  // 内容清洗逻辑
  if (body.content !== undefined) {
    if (typeof body.content !== 'string' || body.content.trim() === '') {
      throw createError({ statusCode: 400, message: '有效内容不能为空' });
    }

    cleanContent = sanitizeHtml(body.content, {
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

    if (cleanContent.length > 10000) {
      throw createError({ statusCode: 400, message: '内容长度超出限制' });
    }
  }

  // 4. 获取独立的 PB 实例 💡
  const pb = getPocketBaseInstance(event);

  if (!pb.authStore.isValid) {
    throw createError({
      statusCode: 401,
      message: '身份认证已过期，请重新登录',
    });
  }

  try {
    // 5. 安全校验：检查文章是否存在且是否为当前用户所有
    // 💡 传入 pb 实例进行查询
    const existingPost = await getPostById(pb, postId);

    if ((existingPost as any).user !== user.id) {
      throw createError({
        statusCode: 403,
        message: '您没有权限修改此内容',
        statusMessage: 'Forbidden',
      });
    }

    // 链接预览处理逻辑
    if (body.link !== undefined) {
      if (body.link === '') {
        linkPreviewData = null;
      } else if (body.link !== (existingPost as any).link) {
        linkPreviewData = await getLinkPreview(body.link);
      }
    }

    // 6. 构造更新载荷
    const updateData: Update<'posts'> = {
      ...(cleanContent !== undefined && { content: cleanContent }),
      ...(body.allow_comment !== undefined && { allow_comment: body.allow_comment }),
      ...(body.published !== undefined && { published: body.published }),
      ...(body.icon !== undefined && { icon: body.icon }),
      ...(body.action !== undefined && { action: body.action }),
      ...(body.link !== undefined && { link: body.link }),
      ...(linkPreviewData !== undefined && { link_data: linkPreviewData }),
    };

    // 7. 执行更新 💡 传入 pb 实例
    const post = await updatePost(pb, postId, updateData);

    return {
      message: '内容已成功更新',
      data: post as any,
    };
  } catch (error) {
    return handlePocketBaseError(error, '内容更新异常');
  }
});

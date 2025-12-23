import { updatePost, getPostById } from '../../../services/posts.service';
import { handlePocketBaseError } from '../../../utils/errorHandler';
import sanitizeHtml from 'sanitize-html';
// 导入业务类型
import type { PostsListResponse, CreatePostRequest } from '~/types/posts';
import type { Update } from '~/types/pocketbase-types';

export default defineEventHandler(async (event): Promise<PostsListResponse> => {
  // 1. 身份校验
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

  // 3. 读取并处理内容
  const body = await readBody<Partial<CreatePostRequest>>(event);
  let cleanContent: string | undefined;

  // 只有当传了 content 时才进行清洗和校验
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

  try {
    // 4. 安全校验：检查文章是否存在且是否为当前用户所有
    const existingPost = await getPostById(postId);
    // 注意：PocketBase 返回的字段可能在 expand 或直接在记录中，这里取决于你的 PB 结构
    // 通常 PB 的记录包含 user 字段（存放 ID）
    if ((existingPost as any).user !== user.id) {
      throw createError({
        statusCode: 403,
        message: '您没有权限修改此内容',
        statusMessage: 'Forbidden',
      });
    }

    // 5. 构造更新载荷
    const updateData: Update<'posts'> = {
      ...(cleanContent !== undefined && { content: cleanContent }),
      ...(body.allow_comment !== undefined && { allow_comment: body.allow_comment }),
      ...(body.published !== undefined && { published: body.published }),
      ...(body.icon !== undefined && { icon: body.icon }),
      ...(body.action !== undefined && { action: body.action }),
    };

    // 6. 执行更新
    const post = await updatePost(postId, updateData);

    return {
      message: '内容已成功更新',
      data: post as any,
    };
  } catch (error) {
    return handlePocketBaseError(error, '内容更新异常');
  }
});

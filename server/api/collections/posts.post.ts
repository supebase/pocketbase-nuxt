import { createPost } from '../../services/posts.service';
import { handlePocketBaseError } from '../../utils/errorHandler';
import { getLinkPreview } from '~~/server/utils/unfurl';
import { getPocketBaseInstance } from '../../utils/pocketbase'; // 💡 引入实例获取函数
import sanitizeHtml from 'sanitize-html';
// 导入业务类型
import type { CreatePostRequest, SinglePostResponse } from '~/types/posts';
import type { Create } from '~/types/pocketbase-types';

export default defineEventHandler(async (event): Promise<SinglePostResponse> => {
  // 1. 获取当前登录用户 (用于业务逻辑判断)
  const session = await getUserSession(event);
  const user = session?.user;

  if (!user?.id) {
    throw createError({
      statusCode: 401,
      message: '请先登录后再发布内容',
      statusMessage: 'Unauthorized',
    });
  }

  // 2. 读取请求体
  const body = await readBody<CreatePostRequest>(event);
  const { content, allow_comment, published, icon, action, link } = body;

  // 3. 基础非空验证
  if (!content || typeof content !== 'string') {
    throw createError({
      statusCode: 400,
      message: '发布内容不能为空',
      statusMessage: 'Bad Request',
    });
  }

  let linkDataString: string | undefined = undefined;

  if (link) {
    const preview = await getLinkPreview(link);
    if (preview) {
      linkDataString = JSON.stringify(preview); // 💡 在这里完成转换
    }
  }

  // 4. HTML 清洗
  const cleanContent = sanitizeHtml(content, {
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
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'nofollow' }),
    },
  });

  // 5. 业务逻辑校验
  if (cleanContent.trim().length === 0) {
    throw createError({
      statusCode: 400,
      message: '有效内容不能为空',
    });
  }

  // 6. 获取独立的 PB 实例 💡
  const pb = getPocketBaseInstance(event);

  if (!pb.authStore.isValid) {
    throw createError({
      statusCode: 401,
      message: '身份认证已过期，请重新登录',
    });
  }

  try {
    // 7. 构造 Payload
    const createData: Create<'posts'> = {
      content: cleanContent,
      user: user.id,
      allow_comment: allow_comment ?? true,
      published: published ?? true,
      icon: icon,
      action: action,
      link: link,
      link_data: linkDataString,
    };

    // 8. 执行创建 (传入 pb 实例) 💡
    const post = await createPost(pb, createData);

    return {
      message: '内容发布成功',
      data: post as any,
    };
  } catch (error) {
    return handlePocketBaseError(error, '内容发布异常，请稍后再试');
  }
});

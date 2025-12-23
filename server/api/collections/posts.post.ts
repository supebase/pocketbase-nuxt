import { createPost } from '../../services/posts.service';
import { handlePocketBaseError } from '../../utils/errorHandler';
import sanitizeHtml from 'sanitize-html';
// 导入业务类型
import type { CreatePostRequest, SinglePostResponse } from '~/types/posts';
import type { Create } from '~/types/pocketbase-types';

export default defineEventHandler(async (event): Promise<SinglePostResponse> => {
  // 1. 获取当前登录用户并进行严格校验
  const session = await getUserSession(event);
  const user = session?.user;

  if (!user?.id) {
    throw createError({
      statusCode: 401,
      message: '请先登录后再发布内容',
      statusMessage: 'Unauthorized',
    });
  }

  // 2. 读取请求体并标注类型
  const body = await readBody<CreatePostRequest>(event);
  const { content, allow_comment, published, icon, action } = body;

  // 3. 基础非空验证
  if (!content || typeof content !== 'string') {
    throw createError({
      statusCode: 400,
      message: '发布内容不能为空',
      statusMessage: 'Bad Request',
    });
  }

  // 4. HTML 清洗 (保持你的安全配置)
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

  if (cleanContent.length > 10000) {
    throw createError({
      statusCode: 400,
      message: '内容超过最大长度限制 (10000 字符)',
    });
  }

  try {
    // 6. 构造符合数据库结构的 Payload
    // 使用 Create<'posts'> 确保除了注入的 user 外，其他字段都合法
    const createData: Create<'posts'> = {
      content: cleanContent,
      user: user.id, // 核心：从 Session 注入用户 ID，确保安全性
      allow_comment: allow_comment ?? true,
      published: published ?? true,
      icon: icon,
      action: action,
    };

    // 7. 执行创建
    const post = await createPost(createData);

    // 8. 返回标准化的业务响应对象
    return {
      message: '内容发布成功',
      data: post as any, // 强制断言或通过 transform 处理
    };
  } catch (error) {
    // 自动转换 PocketBase 抛出的字段校验错误（如内容重复、权限不足等）
    return handlePocketBaseError(error, '内容发布异常，请稍后再试');
  }
});

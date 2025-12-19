import { createPost } from '../../services/posts.service';
import { handlePocketBaseError } from '../../utils/errorHandler';
import sanitizeHtml from "sanitize-html";

export default defineEventHandler(async (event) => {
  // 1. 获取当前登录用户
  const session = await getUserSession(event);
  const user = session?.user;

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: '请先登录',
    });
  }

  // 2. 读取请求体
  const { content, allow_comment, icon, action } = await readBody(event);

  // 3. 参数验证
  if (!content || typeof content !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: '内容不能为空',
    });
  }

  // 4. HTML 清洗 (核心修改点)
  // 我们允许 Markdown 渲染后常见的安全标签，同时允许代码高亮所需的 class
  const cleanContent = sanitizeHtml(content, {
    // 允许 Markdown 转换后常见的 HTML 标签
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      'img', 'details', 'summary', 'h1', 'h2', 'span'
    ],
    // 允许特定的属性，特别是代码高亮所需的 class
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      code: ['class'],
      span: ['class'],
      div: ['class'], // 有些 MDC 组件渲染后会产生带 class 的 div
    },
    // 强制给链接加上 rel="nofollow" 防止 SEO 垃圾信息
    transformTags: {
      'a': sanitizeHtml.simpleTransform('a', { rel: 'nofollow' }),
    }
  });

  // 5. 内容长度限制 (对清洗后的内容进行校验)
  if (cleanContent.length < 1 || cleanContent.length > 10000) {
    throw createError({
      statusCode: 400,
      statusMessage: '内容长度不能超过 10000 字符',
    });
  }

  try {
    // 6. 创建文章记录
    const post = await createPost({
      content: cleanContent, // 使用清洗后的内容
      user: user.id,
      allow_comment: allow_comment,
      icon: icon,
      action: action,
    });

    return {
      message: '内容发布成功',
      post,
    };
  } catch (error) {
    handlePocketBaseError(error, '内容发布失败');
  }
});
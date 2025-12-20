import { createComment } from '../../services/comments.service';
import { handlePocketBaseError } from '../../utils/errorHandler';
import sanitizeHtml from 'sanitize-html';

export default defineEventHandler(async (event) => {
  // 1. 身份验证
  const session = await getUserSession(event);
  const user = session?.user;

  if (!user) {
    throw createError({
      statusCode: 401,
      // 统一改用 message 存放中文提示
      message: '请先登录后再发表评论',
      statusMessage: 'Unauthorized',
    });
  }

  // 2. 读取请求体
  const { comment: rawComment, post } = await readBody(event);

  // 3. 核心防御：清理评论内容（彻底禁止 HTML 标签）
  const cleanComment = sanitizeHtml(rawComment || '', {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  }).trim(); // 建议加上 trim() 防止纯空格评论

  // 4. 业务参数验证
  if (!post) {
    throw createError({
      statusCode: 400,
      message: '关联的贴文 ID 不能为空',
      statusMessage: 'Bad Request',
    });
  }

  if (!cleanComment) {
    throw createError({
      statusCode: 400,
      message: '评论内容不能为空',
      statusMessage: 'Bad Request',
    });
  }

  // 5. 内容长度限制
  if (cleanComment.length > 300) {
    throw createError({
      statusCode: 400,
      message: '评论内容不能超过 300 字符',
      statusMessage: 'Payload Too Large',
    });
  }

  try {
    // 6. 调用服务层创建评论
    const comment = await createComment({
      comment: cleanComment,
      post: post,
      user: user.id,
    });

    // 7. 统一成功返回格式 { message, data }
    return {
      message: '评论已发表',
      data: {
        comment,
      },
    };
  } catch (error) {
    // 8. 统一错误处理，handlePocketBaseError 内部会处理具体的数据库报错
    handlePocketBaseError(error, '发表评论失败，请稍后再试');
  }
});

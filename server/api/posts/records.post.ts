import { pb } from '../../utils/pocketbase';
import { handlePocketBaseError } from '../../utils/errorHandler';

export default defineEventHandler(async (event) => {
  // 获取当前登录用户
  const session = await getUserSession(event);
  const user = session?.user;

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: '请先登录',
    });
  }

  // 读取请求体
 const { content, allow_comment, icon, action } = await readBody(event);

  // 参数验证
  if (!content || typeof content !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: '内容不能为空',
    });
  }

  // 内容长度限制（可根据实际需求调整）
  if (content.length < 1 || content.length > 5000) {
    throw createError({
      statusCode: 400,
      statusMessage: '内容长度需在1-5000字符之间',
    });
  }

  try {
    // 创建文章记录
    const post = await pb.collection('posts').create({
      content: content,
      user: user.id, // 关联当前登录用户
      allow_comment: allow_comment,
      icon: icon,
      action: action,
    });

    return {
      message: '文章发布成功',
      post,
    };
  } catch (error) {
    handlePocketBaseError(error, '文章发布失败');
  }
});

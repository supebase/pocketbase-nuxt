import { toggleLike } from '../../services/likes.service';
import { handlePocketBaseError } from '../../utils/errorHandler';

export default defineEventHandler(async (event) => {
  // 1. 获取当前登录用户
  const session = await getUserSession(event);
  const user = session?.user;

  if (!user) {
    throw createError({
      statusCode: 401,
      // 这里的修改确保前端 err.data.message 能拿到正确提示
      message: '请先登录后操作',
      statusMessage: 'Unauthorized',
    });
  }

  // 2. 读取请求体
  const { comment: commentId } = await readBody(event);

  // 3. 参数验证
  if (!commentId || typeof commentId !== 'string') {
    throw createError({
      statusCode: 400,
      message: '评论 ID 无效或不能为空',
      statusMessage: 'Bad Request',
    });
  }

  try {
    // 4. 切换点赞状态
    // toggleLike 内部通常会处理创建/删除 PocketBase 的 likes 记录
    const result = await toggleLike(commentId, user.id);

    // 5. 统一返回格式 { message, data }
    return {
      message: result.liked ? '点赞成功' : '已取消点赞',
      data: result, // result 通常包含 { liked: boolean, count: number }
    };
  } catch (error) {
    // 这里内部会自动根据 PB 报错生成 message
    handlePocketBaseError(error, '点赞操作失败，请稍后再试');
  }
});

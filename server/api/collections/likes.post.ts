import { toggleLike } from '../../services/likes.service';
import { handlePocketBaseError } from '../../utils/errorHandler';
// 导入点赞相关的业务类型
import type { ToggleLikeRequest, ToggleLikeResponse } from '~/types/likes';

export default defineEventHandler(async (event): Promise<ToggleLikeResponse> => {
  // 1. 获取当前登录用户并校验
  const session = await getUserSession(event);
  const user = session?.user;

  if (!user?.id) {
    throw createError({
      statusCode: 401,
      message: '请先登录后再进行点赞操作',
      statusMessage: 'Unauthorized',
    });
  }

  // 2. 读取并标注请求体类型
  const body = await readBody<ToggleLikeRequest>(event);
  const { comment: commentId } = body;

  // 3. 基础参数验证
  if (!commentId || typeof commentId !== 'string') {
    throw createError({
      statusCode: 400,
      message: '评论 ID 不能为空',
      statusMessage: 'Bad Request',
    });
  }

  try {
    // 4. 执行切换点赞逻辑
    // toggleLike 内部会利用 PBLikesResponse 类型确保字段操作安全
    const result = await toggleLike(commentId, user.id);

    // 5. 返回符合 ToggleLikeResponse 接口的标准化响应
    return {
      message: result.liked ? '点赞成功' : '已取消点赞',
      data: {
        liked: result.liked,
        likes: result.likes,
        commentId: result.commentId,
      },
    };
  } catch (error) {
    // 自动捕获 PocketBase 错误（如评论已被删除导致的点赞失败等）
    return handlePocketBaseError(error, '点赞操作异常，请稍后再试');
  }
});

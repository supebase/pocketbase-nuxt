import { toggleLike } from '../../services/likes.service';
import { handlePocketBaseError } from '../../utils/errorHandler';
import { getPocketBaseInstance } from '../../utils/pocketbase'; // 💡 注入实例获取工具
// 导入点赞相关的业务类型
import type { ToggleLikeRequest, ToggleLikeResponse } from '~/types/likes';

export default defineEventHandler(async (event): Promise<ToggleLikeResponse> => {
  // 1. 获取当前登录用户并校验 (用于业务判断)
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

  // 4. 获取本次请求专用的独立 PB 实例 💡
  const pb = getPocketBaseInstance(event);

  try {
    // 5. 执行切换点赞逻辑 (传入 pb 实例) 💡
    // toggleLike 内部会调用 pb.collection('likes')，
    // 这将自动应用 PocketBase 后台的 API Rules。
    const result = await toggleLike(pb, commentId, user.id);

    // 6. 返回标准化响应
    return {
      message: result.liked ? '点赞成功' : '已取消点赞',
      data: {
        liked: result.liked,
        likes: result.likes,
        commentId: result.commentId,
      },
    };
  } catch (error) {
    // 自动捕获如：评论已被删除、权限不足等错误
    return handlePocketBaseError(error, '点赞操作异常，请稍后再试');
  }
});
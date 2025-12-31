/**
 * @file API Route: /api/collections/likes [POST]
 * @description 处理用户对评论的点赞/取消点赞操作的 API 端点。
 *              这是一个 "toggle" 接口，会根据当前的点赞状态自动执行相反的操作。
 */

// 导入核心的点赞切换服务。
import { toggleLike } from '../../services/likes.service';
// 导入统一的 PocketBase 错误处理器。
import { handlePocketBaseError } from '../../utils/errorHandler';
// 导入与点赞相关的业务类型定义。
import type { ToggleLikeRequest, ToggleLikeResponse } from '~/types/likes';

/**
 * 定义处理点赞切换请求的事件处理器。
 */
export default defineEventHandler(async (event): Promise<ToggleLikeResponse> => {
  // 步骤 1: 强制进行身份验证。
  // 点赞是一个与特定用户关联的操作，因此必须确保用户已登录。
  // 新增: 从事件上下文中获取用户信息
  // 认证逻辑已由中间件统一处理，此处可安全地使用非空断言 `!`。
  const pb = event.context.pb;
  const user = event.context.user;

  // 步骤 2: 从请求体中读取并校验参数。
  const body = await readBody<ToggleLikeRequest>(event);
  const { comment: commentId } = body;

  // 步骤 3: 对核心参数 `commentId` 进行严格的类型和存在性验证。
  if (!commentId || typeof commentId !== 'string') {
    throw createError({
      statusCode: 400,
      message: '评论 ID 不能为空',
      statusMessage: 'Bad Request',
    });
  }

  try {
    // 步骤 4: 调用服务层的 `toggleLike` 函数来执行核心业务逻辑。
    // 这个函数会处理所有复杂性：
    //   a. 检查该用户是否已经为该评论点赞。
    //   b. 如果已点赞，则删除该点赞记录。
    //   c. 如果未点赞，则创建一条新的点赞记录。
    //   d. 返回操作后的最新状态（是否点赞，以及最新的点赞总数）。
    const result = await toggleLike(pb, commentId, user.id);

    // 步骤 5: 根据服务返回的结果，构建一个清晰、标准化的前端响应。
    return {
      message: result.liked ? '点赞成功' : '已取消点赞', // 根据操作结果给出不同的提示信息
      data: {
        liked: result.liked,             // 当前是否点赞 (boolean)
        likes: result.likes,             // 最新的点赞总数 (number)
        commentId: result.commentId,     // 操作的评论 ID (string)
      },
    };
  } catch (error) {
    // 统一处理在 `toggleLike` 过程中可能发生的各种错误。
    // 例如：评论不存在、数据库写入失败、权限问题（如果 PocketBase 有相关规则）等。
    return handlePocketBaseError(error, '点赞操作异常，请稍后再试');
  }
});

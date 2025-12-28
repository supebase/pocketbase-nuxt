/**
 * @file API Route: /api/collections/comment/:id [DELETE]
 * @description 删除单条评论的 API 端点。
 *              执行严格的权限验证，确保只有评论的创建者本人才能删除该评论。
 */

// 导入获取和删除评论的服务函数。
import { deleteComment, getCommentById } from '../../../services/comments.service';
// 导入统一的 PocketBase 错误处理器。
import { handlePocketBaseError } from '../../../utils/errorHandler';
// 导入用于获取当前请求唯一的 PocketBase 实例的函数。
import { getPocketBaseInstance } from '../../../utils/pocketbase';

/**
 * 定义处理删除评论请求的事件处理器。
 */
export default defineEventHandler(async (event): Promise<{ message: string; data: any }> => {
  // 步骤 1: 进行身份验证，确保用户已登录。
  // 新增: 从事件上下文中获取用户信息
  // 认证逻辑已由中间件统一处理，此处可安全地使用非空断言 `!`。
  const user = event.context.user!;

  // 步骤 2: 从路由参数中获取要删除的评论 ID。
  // 例如，对于请求 /api/collections/comment/xyz123, `commentId` 将是 "xyz123"。
  const commentId = getRouterParam(event, 'id');
  if (!commentId) {
    // 如果 ID 不存在，这是一个无效请求。
    throw createError({
      statusCode: 400,
      message: '删除 ID 不能为空',
    });
  }

  // 步骤 3: 获取 PocketBase 实例。
  const pb = getPocketBaseInstance(event);

  try {
    // 步骤 4: **核心安全校验** - 验证操作权限。
    // 在执行删除之前，首先使用 `getCommentById` 从数据库中获取该评论的完整信息。
    // 这一步至关重要，因为它让我们能够检查评论的归属。
    const existingComment = await getCommentById(pb, commentId);

    // 检查从数据库中获取的评论的 `user` 字段（即作者ID）
    // 是否与当前通过 Session 认证的用户的 `id` 相匹配。
    if ((existingComment as any).user !== user.id) {
      // 如果不匹配，意味着一个用户正试图删除不属于他/她的评论。
      // 立即抛出 403 Forbidden 错误，拒绝该请求。
      throw createError({
        statusCode: 403,
        message: '您没有权限删除此评论',
        statusMessage: 'Forbidden',
      });
    }

    // 步骤 5: 在权限验证通过后，执行实际的删除操作。
    // 同样传入 `pb` 实例，`deleteComment` 将以当前用户的身份执行此操作。
    const comment = await deleteComment(pb, commentId);

    // 返回成功的响应。
    return {
      message: '评论已成功删除',
      data: comment as any,
    };
  } catch (error) {
    // 捕获在过程中可能发生的任何错误，包括 `getCommentById` 找不到评论（这也会被 `handlePocketBaseError` 正确处理）
    // 或上面手动抛出的 403 错误。
    return handlePocketBaseError(error, '评论删除异常');
  }
});

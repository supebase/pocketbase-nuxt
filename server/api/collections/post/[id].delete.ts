/**
 * @file API Route: /api/collections/post/:id [DELETE]
 * @description 删除单篇内容（文章）的 API 端点。
 *              执行严格的权限验证，确保只有文章的创建者本人才能删除该文章。
 */

// 导入获取和删除文章的服务函数。
import { deletePost, getPostById } from '../../../services/posts.service';
// 导入统一的 PocketBase 错误处理器。
import { handlePocketBaseError } from '../../../utils/errorHandler';
// 导入用于获取当前请求唯一的 PocketBase 实例的函数。
import { getPocketBaseInstance } from '../../../utils/pocketbase';

/**
 * 定义处理删除文章请求的事件处理器。
 */
export default defineEventHandler(async (event): Promise<{ message: string; data: any }> => {
  // 步骤 1: 进行身份验证，确保用户已登录。
  // 新增: 从事件上下文中获取用户信息
  // 认证逻辑已由中间件统一处理，此处可安全地使用非空断言 `!`。
  const user = event.context.user!;

  // 步骤 2: 从路由参数中获取要删除的文章 ID。
  const postId = getRouterParam(event, 'id');
  if (!postId) {
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
    // 在执行删除之前，首先使用 `getPostById` 从数据库中获取该文章的完整信息。
    // 这一步至关重要，因为它让我们能够检查文章的归属。
    const existingPost = await getPostById(pb, postId);

    // 检查从数据库中获取的文章的 `user` 字段（即作者ID）
    // 是否与当前通过 Session 认证的用户的 `id` 相匹配。
    if ((existingPost as any).user !== user.id) {
      // 如果不匹配，意味着一个用户正试图删除不属于他/她的文章。
      // 立即抛出 403 Forbidden 错误，拒绝该请求。
      throw createError({
        statusCode: 403,
        message: '您没有权限删除此内容',
        statusMessage: 'Forbidden',
      });
    }

    // 步骤 5: 在权限验证通过后，执行实际的删除操作。
    // 同样传入 `pb` 实例，`deletePost` 将以当前用户的身份执行此操作。
    const post = await deletePost(pb, postId);

    // 返回成功的响应。
    return {
      message: '内容已成功删除',
      data: post as any,
    };
  } catch (error) {
    // 捕获在过程中可能发生的任何错误，包括 `getPostById` 找不到文章（这也会被 `handlePocketBaseError` 正确处理）
    // 或上面手动抛出的 403 错误。
    return handlePocketBaseError(error, '内容删除异常');
  }
});

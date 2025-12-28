/**
 * @file API Route: /api/collections/comments [GET]
 * @description 获取评论列表的 API 端点。
 *              支持分页、过滤，并能根据当前登录的用户信息，返回每条评论的点赞状态。
 */

// 导入核心的评论列表获取服务。
import { getCommentsList } from '../../services/comments.service';
// 导入统一的 PocketBase 错误处理器。
import { handlePocketBaseError } from '../../utils/errorHandler';
// 导入用于获取当前请求唯一的 PocketBase 实例的函数。
import { getPocketBaseInstance } from '../../utils/pocketbase';
// 导入前端期望的、经过包装的响应类型。
import type { CommentsListResponse } from '~/types/comments';

/**
 * 定义处理获取评论列表请求的事件处理器。
 */
export default defineEventHandler(async (event): Promise<CommentsListResponse> => {
  try {
    // 步骤 1: 尝试获取当前用户的会话信息。
    // 这个操作不会强制要求用户登录。如果用户未登录，`session` 会是 `null`。
    // 我们主要需要 `userId` 来判断后续的点赞状态。
    const session = await getUserSession(event);
    const userId = session?.user?.id || '';

    // 步骤 2: 从 URL 查询字符串中获取所有参数 (e.g., /api/comments?page=2&perPage=10&postId=...)
    const query = getQuery(event);

    // 步骤 3: 对分页参数进行处理和纠偏，防止无效或过大的值。
    // `page` 最小为 1。
    const page = Math.max(1, Number(query.page) || 1);
    // `perPage` 最小为 1，最大为 100，默认值为 20。
    const perPage = Math.min(100, Math.max(1, Number(query.perPage) || 20));

    // 步骤 4: 构建 PocketBase 查询的 `filter` 字符串。
    const postId = query.postId as string | undefined;
    let filter = query.filter as string | undefined;

    // 如果请求中明确提供了 `postId`，我们优先使用它来构建一个精确的过滤器，
    // 这会覆盖掉任何可能存在的通用 `filter` 参数。
    if (postId) {
      filter = `post = "${postId}"`; // PocketBase filter 语法
    }

    // 步骤 5: 获取本次请求专用的 PocketBase 实例。
    // 💡 即使这是一个公开的读取操作，我们也把实例 `pb` 传递下去。
    //    这是因为 `getCommentsList` 服务内部需要用它来（可能以已登录用户的身份）查询点赞信息，
    //    从而正确地标记每条评论的 `isLiked` 状态。
    const pb = getPocketBaseInstance(event);

    // 步骤 6: 调用服务层的 `getCommentsList` 函数，并传入所有处理好的参数。
    // 所有的数据获取和整合逻辑都在服务层完成。
    const {
      items,          // 经过处理的评论列表 (CommentRecord[])
      totalItems,     // 符合条件的总项目数
      page: currentPage,   // 当前页码
      perPage: currentPerPage, // 每页数量
    } = await getCommentsList(pb, page, perPage, filter, userId);

    // 步骤 7: 将服务层返回的数据包装成标准化的 API 响应格式。
    return {
      message: '获取评论列表成功',
      data: {
        comments: items as any, // as any 是为了绕过一些深层类型推断问题
        totalItems,
        page: currentPage,
        perPage: currentPerPage,
      },
    };
  } catch (error) {
    // 步骤 8: 如果在任何步骤中发生错误，统一由错误处理器进行处理。
    return handlePocketBaseError(error, '获取评论列表异常，请重试');
  }
});

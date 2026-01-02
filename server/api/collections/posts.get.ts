/**
 * @file API Route: /api/collections/posts [GET]
 * @description 获取内容（文章）列表的 API 端点。
 *              支持分页功能。
 */
import { getPostsList } from '../../services/posts.service';
import { handlePocketBaseError } from '../../utils/error-handler';
import type { PostsListResponse } from '~/types/posts';

/**
 * 定义处理获取文章列表请求的事件处理器。
 */
export default defineEventHandler(async (event): Promise<PostsListResponse> => {
  try {
    // 从 URL 查询字符串中获取所有参数 (e.g., /api/posts?page=2&perPage=15)
    const query = getQuery(event);

    // 步骤 1: 提取并校验分页参数。
    // `page` 参数最小为 1，默认值为 1。
    const requestedPage = Math.max(1, Number(query.page) || 1);
    // `perPage` 参数最小为 1，最大为 100，默认值为 10。
    // 限制 `perPage` 的最大值是一个很好的安全实践，可以防止客户端请求过多数据导致服务器压力过大。
    const perPageLimit = Math.min(100, Number(query.perPage) || 10);
    // 获取关键词参数 'q'
    const keyword = query.q as string | undefined;

    // 步骤 2: 获取本次请求专用的 PocketBase 实例。
    // 这个实例可能是匿名的（如果用户未登录），也可能包含了用户的认证信息。
    // `getPostsList` 服务可以利用这一点来处理不同权限下的数据可见性（如果需要的话）。
    const pb = event.context.pb;

    // 步骤 3: 调用服务层的 `getPostsList` 函数，传入 `pb` 实例和处理好的分页参数。
    // 所有实际的数据库查询逻辑都封装在服务层中，实现了关注点分离。
    const { items, totalItems, page, perPage } = await getPostsList(
      pb,
      requestedPage,
      perPageLimit,
      keyword
    );

    // 步骤 4: 将服务层返回的数据包装成标准化的 API 响应格式。
    return {
      message: '获取内容列表成功',
      data: {
        posts: items as any, // 使用 `as any` 以简化类型传递
        totalItems, // 总项目数
        page, // 当前页码
        perPage, // 每页项目数
      },
    };
  } catch (error: any) {
    // 步骤 5: 如果在任何步骤中发生错误，统一由错误处理器进行处理。
    return handlePocketBaseError(error, '获取内容列表异常');
  }
});

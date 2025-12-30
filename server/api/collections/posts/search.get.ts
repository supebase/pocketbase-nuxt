/**
 * @file API Route: /api/collections/posts/search [GET]
 * @description 搜索文章的 API 端点。
 *              支持根据内容或用户名称进行模糊搜索。
 */

// 导入核心的文章搜索服务。
import { searchPosts } from '~~/server/services/posts.service';
// 导入统一的 PocketBase 错误处理器。
import { handlePocketBaseError } from '~~/server/utils/errorHandler';
// 导入用于获取当前请求唯一的 PocketBase 实例的函数。
import { getPocketBaseInstance } from '~~/server/utils/pocketbase';
// 导入前端期望的、经过包装的响应类型。
import type { PostsListResponse } from '~/types/posts';

export default defineEventHandler(async (event): Promise<PostsListResponse> => {
  // 1. 获取查询参数
  const query = getQuery(event);
  const searchTerm = String(query.q || '');
  const page = Number(query.page || 1);
  const perPage = Number(query.perPage || 10);

  // 2. 获取与当前请求上下文绑定的 PocketBase 实例
  // 该实例会自动从 Cookie 中加载认证信息
  const pb = getPocketBaseInstance(event);

  try {
    // 3. 如果搜索词为空，直接返回空结果，避免无效请求
    if (!searchTerm.trim()) {
      return {
        message: '搜索关键字不能为空',
        data: {
          posts: [],
          totalItems: 0,
          page: 1,
          perPage,
        },
      };
    }

    // 4. 调用 Service 层执行搜索逻辑
    // 注意：这里需要确保你在 posts.service.ts 中已经按照上一步的建议添加了 searchPosts 函数
    const result = await searchPosts(pb, searchTerm, page, perPage);

    // 5. 返回符合前端 PostsListResponse 接口的数据结构
    return {
      message: 'success',
      data: {
        posts: result.items, // 包含经过 expand 的 PostRecord
        totalItems: result.totalItems,
        page: result.page,
        perPage: result.perPage,
      },
    };
  } catch (error: any) {
    // 如果在任何步骤中发生错误，统一由错误处理器进行处理。
    return handlePocketBaseError(error, '搜索发生异常');
  }
});

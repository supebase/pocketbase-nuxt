/**
 * @file API Route: /api/collections/posts [GET]
 * @description 获取内容（文章）列表的 API 端点。
 *              支持分页功能。
 */
import { getPaginationParams } from '../../utils/pagination';
import { defineApiHandler } from '~~/server/utils/api-wrapper';
import type { PostsListResponse } from '~/types/posts';

/**
 * 定义处理获取文章列表请求的事件处理器。
 */
export default defineApiHandler(async (event): Promise<PostsListResponse> => {
  const pb = event.context.pb;

  // 步骤 1: 使用工具函数提取分页参数
  const { page, perPage, query } = getPaginationParams(event, {
    page: 1,
    perPage: 10,
    maxPerPage: 100,
  });

  // 步骤 2: 提取业务搜索参数
  const keyword = query.q as string | undefined;

  // 步骤 3: 调用服务
  const {
    items,
    totalItems,
    page: currentPage,
    perPage: currentPerPage,
  } = await getPostsList({
    pb,
    page,
    perPage,
    query: keyword,
  });

  return {
    message: '获取内容列表成功',
    data: {
      posts: items,
      totalItems,
      page: currentPage,
      perPage: currentPerPage,
    },
  };
});

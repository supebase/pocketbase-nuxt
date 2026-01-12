/**
 * @file API Route: /api/collections/posts [GET]
 * @description 获取文章列表。集成自动化分页解析、关键词搜索以及 Service 层聚合查询。
 */

import { getPaginationParams } from '../../utils/pagination';
import { defineApiHandler } from '~~/server/utils/api-wrapper';
import type { PostsListResponse } from '~/types/posts';

export default defineApiHandler(async (event): Promise<PostsListResponse> => {
  const pb = event.context.pb;

  // 分页参数解析：从 Query String 中提取并执行边界清洗 (Clamping)
  const { page, perPage, query } = getPaginationParams(event, {
    page: 1,
    perPage: 10,
    maxPerPage: 100,
  });

  // 业务参数提取：获取可选的搜索关键词
  const keyword = query.q as string | undefined;

  // 调用 Service 层：执行带有分页和过滤条件的数据库查询
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

  // 返回标准化的分页响应结构
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

/**
 * @file API Route: /api/collections/comments [GET]
 * @description 获取评论列表。支持按文章 ID 筛选、分页加载，并根据登录状态注入点赞标识。
 */
import { getPaginationParams } from '../../utils/pagination';
import { defineApiHandler } from '~~/server/utils/api-wrapper';
import type { CommentsListResponse } from '~/types/comments';

export default defineApiHandler(async (event): Promise<CommentsListResponse> => {
  // 认证状态处理：此接口不强制登录，但 userId 是获取点赞状态的关键
  const { pb, user } = event.context;
  const userId = user?.id || '';

  // 分页参数解析：评论场景通常采用 20 条/页的步长以兼顾首屏性能与交互
  const { page, perPage, query } = getPaginationParams(event, {
    page: 1,
    perPage: 20,
    maxPerPage: 100,
  });

  // 动态过滤条件构建
  const postId = (query.post || query.postId) as string | undefined;
  let filter = query.filter as string | undefined;

  // 优先按 post ID 筛选，并使用 pb.filter 占位符防止 SQL/Filter 注入
  if (postId) {
    filter = pb.filter('post = {:postId}', { postId });
  }

  // 调用 Service 层：执行评论抓取与用户信息 Expand
  // getCommentsList 内部应处理了：数据分页 + 用户头像关联 + 当前用户点赞状态匹配
  const {
    items,
    totalItems,
    page: currentPage,
    perPage: currentPerPage,
  } = await getCommentsList({
    pb,
    page,
    perPage,
    filter,
    userId,
  });

  // 返回标准化的分页响应
  return {
    message: '获取评论列表成功',
    data: {
      comments: items,
      totalItems,
      page: currentPage,
      perPage: currentPerPage,
    },
  };
});

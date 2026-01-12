/**
 * @file Comments Service
 * @description 处理评论的增删查改，并聚合点赞数及当前用户点赞状态。
 */

import { ensureOwnership } from '~~/server/utils/validate-owner';
import type { CommentsResponse as PBCommentsResponse } from '~/types/pocketbase-types';
import type { CommentRecord, CommentExpand } from '~/types/comments';
import { GetCommentsOptions, GetCommentByIdOptions, CreateCommentOptions, DeleteCommentOptions } from '~/types/server';

/**
 * 分页获取评论列表
 * @description 核心逻辑：获取基础评论 -> 批量查询点赞 Map -> 合并数据
 */
export async function getCommentsList({ pb, page = 1, perPage = 10, filter, userId }: GetCommentsOptions) {
  const queryOptions: any = {
    sort: '-created',
    expand: 'user',
  };

  if (filter) {
    queryOptions.filter = filter;
  }

  // 获取基础分页数据
  const result = await pb
    .collection('comments')
    .getList<PBCommentsResponse<CommentExpand>>(page, perPage, queryOptions);

  // 批量聚合点赞信息 (Likes Metadata)
  const commentIds = result.items.map((comment) => comment.id);
  const likesMap = await getCommentsLikesMap({ pb, commentIds, userId });

  // 组装最终 UI 所需的 CommentRecord
  const processedItems: CommentRecord[] = result.items.map((comment) => {
    const likeInfo = likesMap[comment.id];
    return {
      ...comment,
      likes: likeInfo?.likes || 0,
      isLiked: userId ? !!likeInfo?.isLiked : false,
      initialized: true,
    } as CommentRecord;
  });

  return {
    items: processedItems,
    totalItems: result.totalItems,
    page: result.page,
    perPage: result.perPage,
    totalPages: result.totalPages,
  };
}

/**
 * 根据 ID 获取单条评论
 */
export async function getCommentById({ pb, commentId }: GetCommentByIdOptions) {
  return await pb.collection('comments').getOne<PBCommentsResponse<CommentExpand>>(commentId, {
    expand: 'user',
  });
}

/**
 * 创建新评论
 * @description PocketBase 会基于 pb.authStore 自动关联 user 字段
 */
export async function createComment({ pb, data }: CreateCommentOptions) {
  return await pb.collection('comments').create<PBCommentsResponse<CommentExpand>>(data, {
    expand: 'user',
  });
}

/**
 * 删除评论
 * @description 包含所有权校验，防止越权操作
 */
export async function deleteComment({ pb, commentId }: DeleteCommentOptions) {
  await ensureOwnership(pb, 'comments', commentId);
  return await pb.collection('comments').delete(commentId);
}

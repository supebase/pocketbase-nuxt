/**
 * @file Comments Service
 * @description 处理评论的增删查改。
 * @note 已移除点赞聚合逻辑，遵循单一职责原则。
 */
import type {
  CommentsResponse as PBCommentsResponse,
  CommentExpand,
  GetCommentsOptions,
  GetCommentByIdOptions,
  CreateCommentOptions,
  DeleteCommentOptions,
} from '~/types';

/**
 * 分页获取评论列表
 * @description 获取基础评论数据及其作者信息
 */
export async function getCommentsList({ pb, page = 1, perPage = 10, filter }: GetCommentsOptions) {
  const queryOptions: any = {
    sort: '-created',
    expand: 'user',
  };

  if (filter) {
    queryOptions.filter = filter;
  }

  // 获取基础分页数据
  return await pb.collection('comments').getList<PBCommentsResponse<CommentExpand>>(page, perPage, queryOptions);
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
 */
export async function createComment({ pb, data }: CreateCommentOptions) {
  return await pb.collection('comments').create<PBCommentsResponse<CommentExpand>>(data, {
    expand: 'user',
  });
}

/**
 * 删除评论
 */
export async function deleteComment({ pb, commentId }: DeleteCommentOptions) {
  await ensureOwnership(pb, 'comments', commentId);
  return await pb.collection('comments').delete(commentId);
}

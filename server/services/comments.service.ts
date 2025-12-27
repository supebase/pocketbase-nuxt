/**
 * 评论服务层
 */
import { getCommentsLikesMap } from './likes.service';
import type { CommentRecord, CommentExpand } from '~/types/comments';
import type {
  CommentsResponse as PBCommentsResponse,
  Create,
  TypedPocketBase,
} from '~/types/pocketbase-types';

/**
 * 获取评论列表
 * @param pb 注入的独立 PB 实例
 */
export async function getCommentsList(
  pb: TypedPocketBase,
  page: number = 1,
  perPage: number = 10,
  filter?: string,
  userId?: string
) {
  const queryOptions: any = {
    sort: '-created',
    expand: 'user',
  };

  if (filter) {
    queryOptions.filter = filter;
  }

  // 1. 使用传入的 pb 获取评论基础数据
  const result = await pb
    .collection('comments')
    .getList<PBCommentsResponse<CommentExpand>>(page, perPage, queryOptions);

  // 2. 获取评论的点赞信息
  if (result.items.length > 0) {
    const commentIds = result.items.map((comment) => comment.id);

    // 💡 关键：将 pb 实例接力传给 likesService
    const likesMap = await getCommentsLikesMap(pb, commentIds, userId || '');

    // 3. 映射为业务 CommentRecord 类型
    // @ts-ignore - 这里的 items 重新赋值需要处理类型兼容或强制断言
    result.items = result.items.map((comment) => {
      const likeInfo = likesMap[comment.id];
      return {
        ...comment,
        likes: likeInfo?.likes || 0,
        isLiked: userId ? likeInfo?.isLiked || false : false,
        initialized: true,
      } as CommentRecord;
    });
  }

  return result;
}

/**
 * 获取单篇评论详情
 */
export async function getCommentById(pb: TypedPocketBase, commentId: string) {
  return await pb.collection('comments').getOne<PBCommentsResponse<CommentExpand>>(commentId, {
    expand: 'user',
  });
}

/**
 * 创建新评论
 */
export async function createComment(pb: TypedPocketBase, data: Create<'comments'>) {
  // 💡 使用传入的 pb 实例，会自动关联当前登录用户的 Token
  return await pb.collection('comments').create<PBCommentsResponse<CommentExpand>>(data, {
    expand: 'user',
  });
}

/**
 * 删除评论
 */
export async function deleteComment(pb: TypedPocketBase, commentId: string) {
  // 💡 使用传入的 pb 实例，会自动关联当前登录用户的 Token
  return await pb.collection('comments').delete(commentId);
}

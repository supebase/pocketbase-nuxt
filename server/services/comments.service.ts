/**
 * 评论服务层
 */
import { pb } from '../utils/pocketbase';
import { getCommentsLikesMap } from './likes.service';
import type { CommentRecord, CommentExpand } from '~/types/comments';
import type { CommentsResponse as PBCommentsResponse, Create } from '~/types/pocketbase-types';

/**
 * 获取评论列表
 */
export async function getCommentsList(
  page: number = 1,
  perPage: number = 10,
  filter?: string,
  userId?: string
) {
  const queryOptions: any = {
    sort: '-created',
    expand: 'user', // 对应 CommentExpand 定义
  };

  if (filter) {
    queryOptions.filter = filter;
  }

  // 使用 PB 生成的 Response 类型并传入 Expand 泛型
  const result = await pb
    .collection('comments')
    .getList<PBCommentsResponse<CommentExpand>>(page, perPage, queryOptions);

  // 获取评论的点赞信息
  if (result.items.length > 0) {
    const commentIds = result.items.map((comment) => comment.id);
    const likesMap = await getCommentsLikesMap(commentIds, userId || '');

    // 将原始 PB 记录映射为业务 CommentRecord 类型
    result.items = result.items.map((comment) => {
      const likeInfo = likesMap[comment.id];
      return {
        ...comment,
        likes: likeInfo?.likes || 0,
        isLiked: userId ? likeInfo?.isLiked || false : false,
        initialized: true, // 默认标记为已初始化
      } as CommentRecord; // 强制断言以匹配业务 Record 定义
    });
  }

  return result;
}

/**
 * 创建新评论
 * @param data 推荐使用 Create<'comments'>
 */
export async function createComment(data: Create<'comments'>) {
  // 创建评论并返回包含用户信息的完整评论
  return await pb.collection('comments').create<PBCommentsResponse<CommentExpand>>(data, {
    expand: 'user',
  });
}

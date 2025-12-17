/**
 * 评论服务层
 */
import { pb } from '../utils/pocketbase';
import { getCommentsLikesMap } from './likes.service';

/**
 * 获取评论列表
 * @param page 页码，默认为1
 * @param perPage 每页数量，默认为20
 * @param filter 过滤条件，可选
 * @param userId 用户ID，用于获取点赞状态
 * @returns 评论列表及分页信息
 */
export async function getCommentsList(page: number = 1, perPage: number = 20, filter?: string, userId?: string) {
  const queryOptions: any = {
    sort: '-created',
    expand: 'user'
  };

  if (filter) {
    queryOptions.filter = filter;
  }

  const result = await pb.collection('comments').getList(
    page,
    perPage,
    queryOptions
  );

  // 获取评论的点赞信息
  if (result.items.length > 0) {
    const commentIds = result.items.map(comment => comment.id);
    // 即使 userId 为空，也要获取点赞数
    const likesMap = await getCommentsLikesMap(commentIds, userId || "");

    result.items = result.items.map(comment => {
      const likeInfo = likesMap[comment.id];
      return {
        ...comment,
        likes: likeInfo?.likes || 0,
        // 如果没登录，isLiked 永远是 false
        isLiked: userId ? (likeInfo?.isLiked || false) : false
      };
    });
  }

  return result;
}

/**
 * 创建新评论
 * @param data 评论数据
 * @returns 创建的评论
 */
export async function createComment(data: any) {
  // 创建评论并返回包含用户信息的完整评论
  return await pb.collection('comments').create(data, {
    expand: 'user'
  });
}

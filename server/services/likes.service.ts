/**
 * 点赞服务层
 */
import { pb } from '../utils/pocketbase';
import type { LikesResponse as PBLikesResponse, Create } from '~/types/pocketbase-types';
import type { CommentLikeInfo } from '~/types/likes';

/**
 * 切换点赞状态
 */
export async function toggleLike(commentId: string, userId: string) {
  // 使用 PBLikesResponse 类型确保 items 包含正确的字段
  const result = await pb.collection('likes').getList<PBLikesResponse>(1, 1, {
    filter: `comment="${commentId}" && user="${userId}"`,
    requestKey: null,
  });

  const existingLike = result.items[0];
  let liked = false;

  if (existingLike) {
    await pb.collection('likes').delete(existingLike.id);
    liked = false;
  } else {
    // 使用 Create<'likes'> 类型约束创建负载
    const newLike: Create<'likes'> = {
      user: userId,
      comment: commentId,
    };
    await pb.collection('likes').create(newLike);
    liked = true;
  }

  const likes = await getCommentLikes(commentId);
  return { liked, likes, commentId };
}

/**
 * 获取评论点赞数
 */
export async function getCommentLikes(commentId: string): Promise<number> {
  const result = await pb.collection('likes').getList(1, 1, {
    filter: `comment="${commentId}"`,
    fields: 'id', // 优化：仅请求 ID 以减少传输量
    requestKey: null,
  });

  return result.totalItems;
}

/**
 * 检查用户是否已点赞
 */
export async function isUserLiked(commentId: string, userId: string): Promise<boolean> {
  try {
    const existingLike = await pb
      .collection('likes')
      .getFirstListItem(`comment="${commentId}" && user="${userId}"`, {
        requestKey: null,
      });
    return !!existingLike;
  } catch (e) {
    // getFirstListItem 在没找到时会抛出 404，此处视为未点赞
    return false;
  }
}

/**
 * 批量获取评论点赞信息
 * @returns 映射对象，符合 CommentLikesResponse 结构
 */
export async function getCommentsLikesMap(
  commentIds: string[],
  userId: string
): Promise<Record<string, CommentLikeInfo>> {
  if (!commentIds || commentIds.length === 0) return {};

  // 构建批量查询过滤语句
  const commentFilter = commentIds.map((id) => `comment="${id}"`).join(' || ');

  // 获取所有相关点赞记录
  const allLikes = await pb.collection('likes').getFullList<PBLikesResponse>({
    filter: `(${commentFilter})`,
    requestKey: null,
  });

  const likesMap: Record<string, CommentLikeInfo> = {};

  // 初始化映射表
  commentIds.forEach((id) => {
    likesMap[id] = { commentId: id, likes: 0, isLiked: false };
  });

  // 统计点赞数并标记当前用户点赞状态
  allLikes.forEach((like) => {
    const info = likesMap[like.comment];
    if (info) {
      info.likes++;

      // 如果当前用户 ID 匹配，标记为已点赞
      if (userId && like.user === userId) {
        info.isLiked = true;
      }
    }
  });

  return likesMap;
}

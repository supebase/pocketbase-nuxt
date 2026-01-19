/**
 * @file Likes Service
 * @description 处理点赞业务逻辑。
 */

import type { LikesResponse as PBLikesResponse, Create } from '~/types/pocketbase-types';
import type { CommentLikeInfo } from '~/types/likes';
import type { ToggleLikeOptions, GetCommentLikesOptions, GetCommentsLikesMapOptions } from '~/types/server';

/**
 * 切换点赞状态
 */
export async function toggleLike({ pb, commentId, userId }: ToggleLikeOptions) {
  const filter = pb.filter('comment = {:commentId} && user = {:userId}', { commentId, userId });

  let existingLike: PBLikesResponse | null = null;

  try {
    existingLike = await pb.collection('likes').getFirstListItem(filter, {
      requestKey: null,
    });
  } catch (e) {
    // 找不到记录
  }

  let liked = false;

  if (existingLike) {
    await pb.collection('likes').delete(existingLike.id);
    liked = false;
  } else {
    const newLike: Create<'likes'> = { user: userId, comment: commentId };
    await pb.collection('likes').create(newLike);
    liked = true;
  }

  const likes = await getCommentLikes({ pb, commentId });
  return { liked, likes, commentId };
}

/**
 * 获取单条评论点赞数
 */
export async function getCommentLikes({ pb, commentId }: GetCommentLikesOptions): Promise<number> {
  const result = await pb.collection('likes').getList(1, 1, {
    filter: pb.filter('comment = {:commentId}', { commentId }),
    fields: 'id',
    requestKey: null,
  });
  return result.totalItems;
}

/**
 * 批量获取评论点赞信息（优化版）
 * @description 仅拉取当前用户的点赞状态，防止拉取全表导致 OOM
 */
export async function getCommentsLikesMap({
  pb,
  commentIds,
  userId,
}: GetCommentsLikesMapOptions): Promise<Record<string, CommentLikeInfo>> {
  if (!commentIds || commentIds.length === 0) return {};

  const likesMap: Record<string, CommentLikeInfo> = {};

  // 初始化 Map
  commentIds.forEach((id) => {
    likesMap[id] = { commentId: id, likes: 0, isLiked: false };
  });

  // 并行获取：1. 点赞总数统计 (通常在 View 中处理，此处通过 filter 模拟)
  // 2. 当前用户的点赞状态
  if (userId) {
    // 仅查询当前用户在这些评论中的点赞记录，返回数据量极小且安全
    const userLikesFilter = `user = "${userId}" && (${commentIds.map((id) => `comment = "${id}"`).join(' || ')})`;

    const userLikes = await pb.collection('likes').getFullList<PBLikesResponse>({
      filter: userLikesFilter,
      fields: 'comment',
      requestKey: null,
    });

    userLikes.forEach((like) => {
      if (likesMap[like.comment]) {
        likesMap[like.comment].isLiked = true;
      }
    });
  }

  // 注意：此处 likes 字段默认为 0，建议在 PocketBase 中通过 View 关联 likes_count 字段
  // 或者在 Handler 层通过聚合 SQL 填充。
  return likesMap;
}

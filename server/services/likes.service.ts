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
 * 批量获取评论点赞信息（手动统计版）
 * @description 通过一次性拉取相关点赞记录，在内存中完成计数和状态匹配
 */
export async function getCommentsLikesMap({
  pb,
  commentIds,
  userId,
}: GetCommentsLikesMapOptions): Promise<Record<string, CommentLikeInfo>> {
  if (!commentIds || commentIds.length === 0) return {};

  const likesMap: Record<string, CommentLikeInfo> = {};

  // 1. 初始化 Map
  commentIds.forEach((id) => {
    likesMap[id] = { commentId: id, likes: 0, isLiked: false };
  });

  // 构建针对这些评论的过滤条件
  const commentFilter = `(${commentIds.map((id) => `comment = "${id}"`).join(' || ')})`;

  try {
    // 2. 并行获取：1. 所有相关评论的点赞总记录  2. 当前用户的点赞记录
    const [allLikes, userLikes] = await Promise.all([
      // 获取这些评论的所有点赞（用于统计总数）
      // 注意：如果点赞量极大（单篇文章万级点赞），建议还是用 View。
      pb.collection('likes').getFullList<PBLikesResponse>({
        filter: commentFilter,
        fields: 'comment,user', // 只取必要字段
        requestKey: null,
      }),
      // 获取当前用户的点赞（用于判断 isLiked）
      userId
        ? pb.collection('likes').getFullList<PBLikesResponse>({
            filter: `user = "${userId}" && ${commentFilter}`,
            fields: 'comment',
            requestKey: null,
          })
        : Promise.resolve([]),
    ]);

    // 3. 在内存中统计总点赞数
    allLikes.forEach((like) => {
      if (likesMap[like.comment]) {
        likesMap[like.comment].likes++;
      }
    });

    // 4. 标记当前用户是否点赞
    userLikes.forEach((like) => {
      if (likesMap[like.comment]) {
        likesMap[like.comment].isLiked = true;
      }
    });
  } catch (error) {
    console.error('获取点赞映射失败:', error);
  }

  return likesMap;
}

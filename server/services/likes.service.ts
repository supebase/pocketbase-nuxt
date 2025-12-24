/**
 * 点赞服务层
 */
import type {
  LikesResponse as PBLikesResponse,
  Create,
  TypedPocketBase
} from '~/types/pocketbase-types';
import type { CommentLikeInfo } from '~/types/likes';

/**
 * 切换点赞状态
 */
export async function toggleLike(pb: TypedPocketBase, commentId: string, userId: string) {
  // 💡 使用传入的 pb 实例
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
    const newLike: Create<'likes'> = {
      user: userId,
      comment: commentId,
    };
    await pb.collection('likes').create(newLike);
    liked = true;
  }

  // 💡 记得把 pb 继续向下传给 getCommentLikes
  const likes = await getCommentLikes(pb, commentId);
  return { liked, likes, commentId };
}

/**
 * 获取评论点赞数
 */
export async function getCommentLikes(pb: TypedPocketBase, commentId: string): Promise<number> {
  const result = await pb.collection('likes').getList(1, 1, {
    filter: `comment="${commentId}"`,
    fields: 'id',
    requestKey: null,
  });

  return result.totalItems;
}

/**
 * 检查用户是否已点赞
 */
export async function isUserLiked(pb: TypedPocketBase, commentId: string, userId: string): Promise<boolean> {
  try {
    const existingLike = await pb
      .collection('likes')
      .getFirstListItem(`comment="${commentId}" && user="${userId}"`, {
        requestKey: null,
      });
    return !!existingLike;
  } catch (e) {
    return false;
  }
}

/**
 * 批量获取评论点赞信息
 */
export async function getCommentsLikesMap(
  pb: TypedPocketBase,
  commentIds: string[],
  userId: string
): Promise<Record<string, CommentLikeInfo>> {
  if (!commentIds || commentIds.length === 0) return {};

  const commentFilter = commentIds.map((id) => `comment="${id}"`).join(' || ');

  const allLikes = await pb.collection('likes').getFullList<PBLikesResponse>({
    filter: `(${commentFilter})`,
    requestKey: null,
  });

  const likesMap: Record<string, CommentLikeInfo> = {};

  commentIds.forEach((id) => {
    likesMap[id] = { commentId: id, likes: 0, isLiked: false };
  });

  allLikes.forEach((like) => {
    const info = likesMap[like.comment];
    if (info) {
      info.likes++;
      if (userId && like.user === userId) {
        info.isLiked = true;
      }
    }
  });

  return likesMap;
}
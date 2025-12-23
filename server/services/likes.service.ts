/**
 * 点赞服务层
 */
import { pb } from '../utils/pocketbase';

/**
 * 切换点赞状态
 * @param commentId 评论ID
 * @param userId 用户ID
 * @returns 点赞状态和点赞数
 */
export async function toggleLike(commentId: string, userId: string) {
  // 修正：改用 getList 避免 404 报错
  const result = await pb.collection('likes').getList(1, 1, {
    filter: `comment="${commentId}" && user="${userId}"`,
    requestKey: null,
  });

  const existingLike = result.items[0];
  let liked = false;

  if (existingLike) {
    await pb.collection('likes').delete(existingLike.id);
    liked = false;
  } else {
    await pb.collection('likes').create({
      user: userId,
      comment: commentId,
    });
    liked = true;
  }

  // 这里的 getCommentLikes 也会因为 API Rules 导致统计不准
  // 请务必按照上文修改 PocketBase 的权限设置
  const likes = await getCommentLikes(commentId);

  return { liked, likes, commentId };
}

/**
 * 获取评论点赞数
 * @param commentId 评论ID
 * @returns 点赞数
 */
export async function getCommentLikes(commentId: string) {
  const result = await pb.collection('likes').getList(1, 1, {
    filter: `comment="${commentId}"`,
    fields: 'id',
    requestKey: null,
  });

  return result.totalItems;
}

/**
 * 检查用户是否已点赞
 * @param commentId 评论ID
 * @param userId 用户ID
 * @returns 是否已点赞
 */
export async function isUserLiked(commentId: string, userId: string) {
  const existingLike = await pb
    .collection('likes')
    .getFirstListItem(`comment="${commentId}" && user="${userId}"`, {
      ignoreErrors: true,
    });

  return !!existingLike;
}

/**
 * 批量获取评论点赞信息
 * @param commentIds 评论ID列表
 * @param userId 用户ID
 * @returns 评论点赞信息映射
 */
export async function getCommentsLikesMap(commentIds: string[], userId: string) {
  if (!commentIds || commentIds.length === 0) return {};

  const commentFilter = commentIds.map((id) => `comment="${id}"`).join(' || ');

  const allLikes = await pb.collection('likes').getFullList({
    filter: commentFilter,
    requestKey: null,
  });

  const likesMap: Record<string, { commentId: string; likes: number; isLiked: boolean }> = {};

  // 初始化
  commentIds.forEach((id) => {
    likesMap[id] = { commentId: id, likes: 0, isLiked: false };
  });

  // 填充数据
  allLikes.forEach((like) => {
    if (likesMap[like.comment]) {
      likesMap[like.comment].likes++;

      // 强制转换为字符串对比，并确保 userId 存在
      if (userId && String(like.user) === String(userId)) {
        likesMap[like.comment].isLiked = true;
      }
    }
  });

  return likesMap;
}

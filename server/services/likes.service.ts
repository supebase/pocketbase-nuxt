/**
 * @file Likes Service
 * @description 处理点赞业务逻辑，包含状态切换、单条计数及高性能批量聚合。
 */

import type { LikesResponse as PBLikesResponse, Create } from '~/types/pocketbase-types';
import type { CommentLikeInfo } from '~/types/likes';
import type { ToggleLikeOptions, GetCommentLikesOptions, GetCommentsLikesMapOptions } from '~/types/server';

/**
 * 切换点赞状态
 * @description 逻辑：查询是否存在 -> 存在则删除（取消点赞），不存在则创建（点赞）
 * @returns 返回操作后的最新点赞状态及总数
 */
export async function toggleLike({ pb, commentId, userId }: ToggleLikeOptions) {
  const filter = pb.filter('comment = {:commentId} && user = {:userId}', { commentId, userId });

  let existingLike: PBLikesResponse | null = null;

  try {
    existingLike = await pb.collection('likes').getFirstListItem(filter, {
      // 禁用自动取消，确保操作完整执行
      requestKey: null,
    });
  } catch (e) {
    // 找不到记录会抛出 404，属于正常业务流
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

  // 刷新当前评论的总点赞数
  const likes = await getCommentLikes({ pb, commentId });
  return { liked, likes, commentId };
}

/**
 * 获取单条评论点赞数
 * @description 使用 fields: 'id' 仅返回必要字段，降低传输开销
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
 * 批量获取评论点赞信息（Map 模式）
 * @description 核心逻辑：一次性拉取所有涉及的点赞记录，并在内存中进行分组统计，避免 N+1 查询问题。
 * @returns 键为 commentId，值为点赞元数据的映射表
 */
export async function getCommentsLikesMap({
  pb,
  commentIds,
  userId,
}: GetCommentsLikesMapOptions): Promise<Record<string, CommentLikeInfo>> {
  if (!commentIds || commentIds.length === 0) return {};

  // 构建批量查询过滤（使用 ID 列表检索）
  const commentFilter = commentIds.map((id) => pb.filter('comment = {:id}', { id })).join(' || ');

  const allLikes = await pb.collection('likes').getFullList<PBLikesResponse>({
    filter: `(${commentFilter})`,
    requestKey: null,
  });

  // 初始化结果容器
  const likesMap: Record<string, CommentLikeInfo> = {};
  commentIds.forEach((id) => {
    likesMap[id] = { commentId: id, likes: 0, isLiked: false };
  });

  // 内存聚合统计
  allLikes.forEach((like) => {
    const info = likesMap[like.comment];
    if (info) {
      info.likes++;
      // 如果当前登录用户在该记录中，标记为已点赞
      if (userId && like.user === userId) {
        info.isLiked = true;
      }
    }
  });

  return likesMap;
}

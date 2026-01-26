/**
 * @file Likes Service
 * @description 处理点赞业务逻辑。
 */

import type {
  LikesResponse as PBLikesResponse,
  Create,
  CommentLikeInfo,
  ToggleLikeOptions,
  GetCommentLikesOptions,
  GetCommentsLikesMapOptions,
} from '~/types';

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
 * 批量获取评论点赞信息（极致优化版）
 * @description 利用数据库视图进行聚合计算，彻底解决海量数据下的 OOM 风险
 */
export async function getCommentsLikesMap({
  pb,
  commentIds,
  userId,
}: GetCommentsLikesMapOptions): Promise<Record<string, CommentLikeInfo>> {
  if (!commentIds || commentIds.length === 0) return {};

  // 1. 使用 Map 来存储中间结果，彻底避开 Record 的索引检查问题
  const likesMapData = new Map<string, CommentLikeInfo>();

  commentIds.forEach((id) => {
    likesMapData.set(id, { commentId: id, likes: 0, isLiked: false });
  });

  try {
    const viewFilter = commentIds.map((id) => `id = "${id}"`).join(' || ');
    const likesFilter = commentIds.map((id) => `comment = "${id}"`).join(' || ');

    const [likeCounts, userLikes] = await Promise.all([
      pb.collection('comment_like_counts').getFullList<{ id: string; likes: number }>({
        filter: viewFilter,
        fields: 'id,likes',
        requestKey: null,
      }),
      userId
        ? pb.collection('likes').getFullList<PBLikesResponse>({
            filter: `user = "${userId}" && (${likesFilter})`,
            fields: 'comment',
            requestKey: null,
          })
        : Promise.resolve([]),
    ]);

    // 2. 统计逻辑：使用 Map 的 get/set，TS 能够完美识别
    likeCounts.forEach((item) => {
      const target = likesMapData.get(item.id);
      if (target) {
        target.likes = item.likes;
      }
    });

    // 3. 状态标记
    userLikes.forEach((like) => {
      const target = likesMapData.get(like.comment);
      if (target) {
        target.isLiked = true;
      }
    });
  } catch (error) {
    // 静默处理
  }

  // 4. 将 Map 转换为最终要求的 Record 格式返回
  return Object.fromEntries(likesMapData);
}

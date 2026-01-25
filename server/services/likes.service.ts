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
 * 批量获取评论点赞信息
 * @description 通过一次性拉取相关点赞记录，在内存中完成计数和状态匹配
 */
export async function getCommentsLikesMap({
  pb,
  commentIds,
  userId,
}: GetCommentsLikesMapOptions): Promise<Record<string, CommentLikeInfo>> {
  if (!commentIds || commentIds.length === 0) return {};

  const likesMap: Record<string, CommentLikeInfo> = {};
  commentIds.forEach((id) => {
    likesMap[id] = { commentId: id, likes: 0, isLiked: false };
  });

  try {
    // 1. 构建参数化过滤
    const filterParams: Record<string, string> = {};
    const filterString = commentIds
      .map((id, index) => {
        const key = `id${index}`;
        filterParams[key] = id;
        return `comment = {:${key}}`;
      })
      .join(' || ');

    // 2. 并行请求
    const [allLikes, userLikes] = await Promise.all([
      pb.collection('likes').getFullList<PBLikesResponse>({
        filter: pb.filter(filterString, filterParams),
        fields: 'comment',
        requestKey: null,
      }),
      userId
        ? pb.collection('likes').getFullList<PBLikesResponse>({
            filter: pb.filter(`user = {:userId} && (${filterString})`, {
              userId,
              ...filterParams,
            }),
            fields: 'comment',
            requestKey: null,
          })
        : Promise.resolve([]),
    ]);

    // 3. 内存统计 (去重并修复 TS 报错)
    // 统计总点赞数
    allLikes.forEach((like) => {
      const item = likesMap[like.comment];
      if (item) {
        item.likes++;
      }
    });

    // 标记当前用户点赞状态 (之前你漏掉了这一块)
    userLikes.forEach((like) => {
      const item = likesMap[like.comment];
      if (item) {
        item.isLiked = true;
      }
    });
  } catch (error) {
    // console.error('获取点赞映射失败:', error);
  }

  return likesMap;
}

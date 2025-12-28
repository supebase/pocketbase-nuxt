/**
 * @file 点赞相关的服务层 (Likes Service)
 * @description 该文件封装了所有与点赞功能相关的业务逻辑，
 *              包括切换点赞状态、获取单条评论的点赞数，以及最高效的批量获取多条评论的点赞信息。
 */

// 导入 PocketBase 自动生成的类型和自定义的业务模型。
import type {
  LikesResponse as PBLikesResponse,
  Create,
  TypedPocketBase,
} from '~/types/pocketbase-types';
import type { CommentLikeInfo } from '~/types/likes';

/**
 * 切换指定评论的点赞状态（点赞或取消点赞）。
 * @param pb PocketBase 实例，需包含用户认证信息。
 * @param commentId 被操作的评论 ID。
 * @param userId 执行操作的用户 ID。
 * @returns 返回一个对象，包含操作后的点赞状态 (`liked`)、该评论最新的总点赞数 (`likes`) 和评论 ID。
 */
export async function toggleLike(pb: TypedPocketBase, commentId: string, userId: string) {
  // 步骤 1: 检查用户是否已经对该评论点过赞。
  // `requestKey: null` 用于禁用 PocketBase SDK 的内置缓存，确保我们总是获取最新的数据状态。
  const result = await pb.collection('likes').getList<PBLikesResponse>(1, 1, {
    filter: `comment="${commentId}" && user="${userId}"`,
    requestKey: null,
  });

  const existingLike = result.items[0];
  let liked = false; // 初始化最终的点赞状态为 false

  // 步骤 2: 根据是否存在点赞记录来执行相应操作。
  if (existingLike) {
    // 如果已存在点赞记录，则删除它（取消点赞）。
    await pb.collection('likes').delete(existingLike.id);
    liked = false;
  } else {
    // 如果不存在点赞记录，则创建一条新记录（点赞）。
    const newLike: Create<'likes'> = {
      user: userId,
      comment: commentId,
    };
    await pb.collection('likes').create(newLike);
    liked = true;
  }

  // 步骤 3: 在完成操作后，立即获取并返回该评论最新的总点赞数。
  // 💡 关键：将当前的 `pb` 实例继续传递给 `getCommentLikes` 函数。
  const likes = await getCommentLikes(pb, commentId);
  return { liked, likes, commentId };
}

/**
 * 获取单条评论的总点赞数。
 * @param pb PocketBase 实例。
 * @param commentId 要查询的评论 ID。
 * @returns 返回该评论的点赞总数 (number)。
 */
export async function getCommentLikes(pb: TypedPocketBase, commentId: string): Promise<number> {
  // 这是一个非常高效的查询：
  // - `fields: 'id'`: 我们只需要计数，所以告诉 PocketBase 只返回 `id` 字段即可，减少网络传输。
  // - `getList(1, 1)`: 我们只关心 `totalItems`，所以请求 1 页 1 条数据即可，响应最快。
  const result = await pb.collection('likes').getList(1, 1, {
    filter: `comment="${commentId}"`,
    fields: 'id',
    requestKey: null, // 禁用缓存
  });

  return result.totalItems;
}

/**
 * (备用函数) 检查特定用户是否已对某条评论点赞。
 * 注意：在 `toggleLike` 和 `getCommentsLikesMap` 中已有类似逻辑，此函数可用于需要单独判断的场景。
 * @param pb PocketBase 实例。
 * @param commentId 评论 ID。
 * @param userId 用户 ID。
 * @returns 返回布尔值，`true` 表示已点赞，`false` 表示未点赞。
 */
export async function isUserLiked(
  pb: TypedPocketBase,
  commentId: string,
  userId: string
): Promise<boolean> {
  try {
    // `getFirstListItem` 是一个优化查询，找到第一条匹配的记录后就立即返回，比 `getList` 更快。
    await pb
      .collection('likes')
      .getFirstListItem(`comment="${commentId}" && user="${userId}"`, {
        requestKey: null, // 禁用缓存
      });
    return true; // 如果查询成功找到记录，说明已点赞。
  } catch (e) {
    // 如果 `getFirstListItem` 找不到记录，它会抛出一个 404 错误。
    // 我们捕获这个错误并返回 `false`，这正是我们期望的 "未点赞" 状态。
    return false;
  }
}

/**
 * **[高性能]** 批量获取一组评论的点赞信息（总点赞数和指定用户的点赞状态）。
 * 这是本服务中最核心和最高效的函数。
 * @param pb PocketBase 实例。
 * @param commentIds 需要查询的评论 ID 数组。
 * @param userId 当前登录用户的 ID，用于判断 `isLiked` 状态。
 * @returns 返回一个以评论 ID 为键，点赞信息对象为值的记录 (Record)。
 */
export async function getCommentsLikesMap(
  pb: TypedPocketBase,
  commentIds: string[],
  userId: string
): Promise<Record<string, CommentLikeInfo>> {
  if (!commentIds || commentIds.length === 0) return {};

  // 步骤 1: 构造一个高效的 PocketBase OR 查询过滤器。
  // 例如 `(comment="id1" || comment="id2" || ...)`
  const commentFilter = commentIds.map((id) => `comment="${id}"`).join(' || ');

  // 步骤 2: 使用 `getFullList` 一次性获取所有相关评论的所有点赞记录。
  // 这避免了对每条评论都单独发一次网络请求（即 N+1 问题），性能极高。
  const allLikes = await pb.collection('likes').getFullList<PBLikesResponse>({
    filter: `(${commentFilter})`,
    requestKey: null, // 禁用缓存
  });

  // 步骤 3: 初始化一个映射表，为每个评论 ID 创建一个默认的点赞信息对象。
  const likesMap: Record<string, CommentLikeInfo> = {};
  commentIds.forEach((id) => {
    likesMap[id] = { commentId: id, likes: 0, isLiked: false };
  });

  // 步骤 4: 遍历一次从数据库取回的所有点赞记录，填充映射表。
  allLikes.forEach((like) => {
    const info = likesMap[like.comment];
    if (info) {
      info.likes++; // 对应评论的总点赞数加 1
      // 如果点赞记录的用户是当前登录用户，则标记 `isLiked`为 true。
      if (userId && like.user === userId) {
        info.isLiked = true;
      }
    }
  });

  // 返回构建完成的映射表。
  return likesMap;
}

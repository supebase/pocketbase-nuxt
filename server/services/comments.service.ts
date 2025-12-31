/**
 * @file 评论相关的服务层 (Comments Service)
 * @description 封装了与评论相关的业务逻辑，如获取评论列表、创建和删除评论。
 *              这个服务层的一个关键特性是它会聚合来自点赞服务 (`likes.service`) 的数据，
 *              为每条评论附加点赞数和当前用户的点赞状态。
 */

// 导入点赞服务中的函数，用于批量获取评论的点赞信息。
import { getCommentsLikesMap } from './likes.service';
// 导入前端业务所需的、经过整合的评论记录类型。
import type { CommentRecord, CommentExpand } from '~/types/comments';
// 导入从 PocketBase schema 自动生成的原始评论响应类型和创建类型。
import type {
  CommentsResponse as PBCommentsResponse,
  Create,
  TypedPocketBase,
} from '~/types/pocketbase-types';

/**
 * 获取经过处理的评论列表，包含点赞信息。
 * @param pb 由上层 API handler 传入的 PocketBase 实例。
 * @param page 当前页码，默认为 1。
 * @param perPage 每页的项目数量，默认为 10。
 * @param filter PocketBase 查询语言的过滤字符串，例如 `post="post_id_123"`。
 * @param userId 可选的当前登录用户 ID。如果提供，将一并查询该用户是否对每条评论点了赞。
 * @returns 返回一个分页对象，其中的 `items` 数组是包含了点赞信息的 `CommentRecord` 列表。
 */
export async function getCommentsList(
  pb: TypedPocketBase,
  page: number = 1,
  perPage: number = 10,
  filter?: string,
  userId?: string
) {
  // 构建 PocketBase 查询参数对象。
  const queryOptions: any = {
    sort: '-created', // 按创建时间降序排序
    expand: 'user', // 关联查询创建该评论的用户完整信息
  };

  if (filter) {
    queryOptions.filter = filter;
  }

  // 步骤 1: 使用传入的 PocketBase 实例从 'comments' 集合获取基础的评论分页数据。
  // `expand:'user'` 会让 PocketBase 在返回的数据中包含一个 `expand` 字段，里面是关联的 `users` 记录。
  const result = await pb
    .collection('comments')
    .getList<PBCommentsResponse<CommentExpand>>(page, perPage, queryOptions);

  // 步骤 2: 如果查询结果不为空，则进一步获取这些评论的点赞信息。
  const commentIds = result.items.map((comment) => comment.id);
  const likesMap = await getCommentsLikesMap(pb, commentIds, userId);

  // 💡 使用一个新的变量承载处理后的结果，避免原地修改带来的类型冲突
  const processedItems: CommentRecord[] = result.items.map((comment) => {
    const likeInfo = likesMap[comment.id];
    return {
      ...comment,
      likes: likeInfo?.likes || 0,
      isLiked: userId ? !!likeInfo?.isLiked : false, // 使用 !! 强制转为 boolean
      initialized: true,
    } as CommentRecord;
  });

  // 返回一个新的对象，保持原始的分页元数据
  return {
    items: processedItems,
    totalItems: result.totalItems,
    page: result.page,
    perPage: result.perPage,
    totalPages: result.totalPages,
  };
}

/**
 * 根据 ID 获取单条评论的详细信息。
 * @param pb PocketBase 实例。
 * @param commentId 要查询的评论 ID。
 * @returns 返回包含用户信息（通过 expand）的单条评论数据。
 */
export async function getCommentById(pb: TypedPocketBase, commentId: string) {
  return await pb.collection('comments').getOne<PBCommentsResponse<CommentExpand>>(commentId, {
    expand: 'user', // 关联查询用户信息
  });
}

/**
 * 创建一条新评论。
 * @param pb PocketBase 实例。这个实例应该已经通过 `handleAuthSuccess` 或 `getPocketBase(event)`
 *           加载了用户的认证信息。
 * @param data 符合 `Create<'comments'>` 类型的新评论数据。
 * @returns 返回创建成功后的评论记录，并关联了创建者的用户信息。
 */
export async function createComment(pb: TypedPocketBase, data: Create<'comments'>) {
  // 💡 由于传入的 `pb` 实例已经包含了用户的认证 Token，
  // PocketBase 后端会自动将这条新评论的 `user` 字段设置为当前登录的用户。
  return await pb.collection('comments').create<PBCommentsResponse<CommentExpand>>(data, {
    expand: 'user',
  });
}

/**
 * 删除一条评论。
 * @param pb PocketBase 实例，必须包含发起删除操作的用户的认证信息。
 * @param commentId 要删除的评论 ID。
 * @returns Promise<boolean> 删除成功时 PocketBase SDK 返回 true。
 */
export async function deleteComment(pb: TypedPocketBase, commentId: string) {
  // 1. 获取评论详情
  const comment = await pb.collection('comments').getOne(commentId);

  // 2. 业务级权限检查：如果不是作者本人，且不是管理员（如果需要的话）
  const currentUser = pb.authStore.record;
  if (!currentUser || comment.user !== currentUser.id) {
    throw createError({
      statusCode: 403,
      message: '您没有权限删除此评论',
    });
  }

  return await pb.collection('comments').delete(commentId);
}

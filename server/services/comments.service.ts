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
    sort: '-created',       // 按创建时间降序排序
    expand: 'user',          // 关联查询创建该评论的用户完整信息
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
  if (result.items.length > 0) {
    // 提取所有评论的 ID，用于批量查询。
    const commentIds = result.items.map((comment) => comment.id);

    // 💡 关键：调用点赞服务，将当前的 `pb` 实例和评论 ID 列表传递过去。
    // `getCommentsLikesMap` 会返回一个以评论 ID 为键，点赞信息为值的映射 (Map)。
    const likesMap = await getCommentsLikesMap(pb, commentIds, userId || '');

    // 步骤 3: 将原始的 PocketBase 评论数据 (`PBCommentsResponse`) 映射为前端需要的业务数据 (`CommentRecord`)。
    // 这里通过 `@ts-ignore` 忽略了一个类型警告，因为我们正在原地修改 `result.items` 的类型。
    // @ts-ignore
    result.items = result.items.map((comment) => {
      // 从点赞映射中查找当前评论的点赞数据。
      const likeInfo = likesMap[comment.id];
      // 构建并返回整合后的评论对象。
      return {
        ...comment, // 展开原始评论的所有字段
        likes: likeInfo?.likes || 0, // 附加总点赞数，默认为 0
        // 如果传入了用户 ID，则附加该用户是否点赞的状态，否则为 false。
        isLiked: userId ? likeInfo?.isLiked || false : false,
        initialized: true, // 一个标记，表示这条记录的数据已经过服务端初始化整合
      } as CommentRecord;
    });
  }

  // 返回包含了完整信息的分页结果。
  return result;
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
 * @param pb PocketBase 实例。这个实例应该已经通过 `handleAuthSuccess` 或 `getPocketBaseInstance(event)`
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
  // 💡 PocketBase 会在后端根据集合的 API 规则检查当前登录用户是否有权限删除这条评论。
  // 如果没有权限，SDK 会抛出一个 403 Forbidden 错误。
  return await pb.collection('comments').delete(commentId);
}

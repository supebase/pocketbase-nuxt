/**
 * @file 文章相关的服务层 (Posts Service)
 * @description 负责封装与 PocketBase 数据库 `posts` 集合相关的所有数据操作（CRUD）。
 *              该文件遵循“依赖注入”的设计模式，所有函数都接收一个 PocketBase 实例作为参数，
 *              以确保操作的上下文（特别是用户认证状态）由调用方（API 路由）决定。
 */

// 导入项目自定义的、包含了 `expand` 类型的文章类型定义。
import type { PostExpand } from '~/types/posts';
// 从自动生成的类型文件中导入 PocketBase 相关的类型。
import type {
  Create, // 用于创建记录时，确保数据结构正确的类型
  Update, // 用于更新记录时，允许字段为可选的类型
  PostsResponse as PBPostsResponse, // 原始的、未展开的 `posts` 记录响应类型
  TypedPocketBase, // 经过类型加强的 PocketBase 实例类型
} from '~/types/pocketbase-types';

/**
 * 获取文章列表（支持搜索和分页）。
 * @param pb 由 API 路由层传入的、与当前请求上下文绑定的 PocketBase 实例。
 * @param page 要获取的页码，默认为 1。
 * @param perPage 每页的项目数量，默认为 10。
 * @param query 可选的搜索关键词，用于过滤文章标题或内容。
 * @returns 返回一个分页后的文章列表。
 */
export async function getPostsList(
  pb: TypedPocketBase,
  page: number = 1,
  perPage: number = 10,
  query?: string
) {
  // 1. 基础权限过滤：所有人可见已发布的
  // 或者 (未发布 且 作者是自己)
  let filterString = '(published = true';

  const currentUser = pb.authStore.record;
  if (currentUser) {
    // 如果用户已登录，增加“可见自己草稿”的逻辑
    filterString += ` || (published = false && user = "${currentUser.id}")`;
  }
  filterString += ')';

  // 2. 关键词搜索逻辑
  if (query) {
    // 使用 pb.filter 防止注入，并将搜索逻辑与权限逻辑用 && 连接
    const searchQuery = pb.filter('content ~ {:q}', { q: query });
    filterString = `(${filterString} && ${searchQuery})`;
  }

  const options: any = {
    sort: '-created',
    expand: 'user',
    filter: filterString,
  };

  return await pb.collection('posts').getList<PBPostsResponse<PostExpand>>(page, perPage, options);
}

/**
 * 根据 ID 获取单篇文章的详情。
 * @param pb 与当前请求上下文绑定的 PocketBase 实例。
 * @param postId 要获取的文章的唯一 ID。
 * @returns 返回找到的文章记录。
 */
export async function getPostById(pb: TypedPocketBase, postId: string) {
  const currentUser = pb.authStore.record;

  // 构建安全过滤规则
  let filter = `id = "${postId}" && (published = true`;
  if (currentUser) {
    filter += ` || user = "${currentUser.id}"`;
  }
  filter += ')';

  try {
    // 💡 使用 getFirstListItem 配合 filter，可以在数据库层面直接完成安全校验
    return await pb.collection('posts').getFirstListItem<PBPostsResponse<PostExpand>>(filter, {
      expand: 'user',
    });
  } catch (error: any) {
    // 如果找不到满足条件的记录（可能是 ID 不存在，也可能是权限不足），PocketBase 会抛出 404
    throw createError({
      statusCode: 404,
      message: '文章不存在或您没有权限查看',
    });
  }
}

/**
 * 创建一篇新文章。
 * @param pb 与当前请求上下文绑定的 PocketBase 实例（必须是已认证用户的实例）。
 * @param data 要创建的文章数据。`Create<'posts'>` 类型确保了传入的数据符合数据库 `posts` 集合的字段要求。
 * @returns 返回新创建的文章记录。
 */
export async function createPost(pb: TypedPocketBase, data: Create<'posts'>) {
  // `pb.collection('posts').create` 会自动使用 `pb` 实例中存储的 AuthStore（认证令牌），
  // 因此 PocketBase 知道是哪个用户正在创建这篇文章。
  return await pb.collection('posts').create<PBPostsResponse>(data);
}

/**
 * 更新一篇已有的文章。
 * @param pb 与当前请求上下文绑定的 PocketBase 实例（必须是已认证用户的实例）。
 * @param postId 要更新的文章的 ID。
 * @param data 要更新的文章数据。`Update<'posts'>` 类型使得所有字段都是可选的，允许部分更新。
 * @returns 返回更新后的文章记录。
 */
export async function updatePost(pb: TypedPocketBase, postId: string, data: Update<'posts'>) {
  await ensureOwnership(pb, postId);
  return await pb.collection('posts').update<PBPostsResponse>(postId, data);
}

/**
 * 根据 ID 删除一篇文章。
 * @param pb 与当前请求上下文绑定的 PocketBase 实例（必须是已认证用户的实例）。
 * @param postId 要删除的文章的 ID。
 */
export async function deletePost(pb: TypedPocketBase, postId: string) {
  await ensureOwnership(pb, postId);
  return await pb.collection('posts').delete(postId);
}

async function ensureOwnership(pb: TypedPocketBase, postId: string) {
  const post = await pb.collection('posts').getOne(postId);
  const currentUser = pb.authStore.record;

  if (!currentUser || post.user !== currentUser.id) {
    throw createError({
      statusCode: 403,
      message: '您没有权限操作此内容',
    });
  }
  return post;
}

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
  Create,               // 用于创建记录时，确保数据结构正确的类型
  Update,               // 用于更新记录时，允许字段为可选的类型
  PostsResponse as PBPostsResponse, // 原始的、未展开的 `posts` 记录响应类型
  TypedPocketBase,      // 经过类型加强的 PocketBase 实例类型
} from '~/types/pocketbase-types';

/**
 * 获取文章列表（分页）。
 * @param pb 由 API 路由层传入的、与当前请求上下文绑定的 PocketBase 实例。
 * @param page 要获取的页码，默认为 1。
 * @param perPage 每页的项目数量，默认为 10。
 * @returns 返回一个分页后的文章列表。
 */
export async function getPostsList(pb: TypedPocketBase, page: number = 1, perPage: number = 10) {
  // 使用传入的 `pb` 实例执行查询。如果该实例包含了用户的认证信息，
  // PocketBase 后端将自动根据数据库中设置的 API 规则进行权限校验。
  return await pb.collection('posts').getList<PBPostsResponse<PostExpand>>(page, perPage, {
    sort: '-created',   // 按创建时间降序排序（最新的在前）。
    expand: 'user',   // **关键**: 告诉 PocketBase 在返回文章的同时，也完整地带上关联的 `user` 记录。
    // 这避免了 N+1 查询问题，一次性获取了所有需要的数据。
  });
}

/**
 * 根据 ID 获取单篇文章的详情。
 * @param pb 与当前请求上下文绑定的 PocketBase 实例。
 * @param postId 要获取的文章的唯一 ID。
 * @returns 返回找到的文章记录。
 */
export async function getPostById(pb: TypedPocketBase, postId: string) {
  return await pb.collection('posts').getOne<PBPostsResponse<PostExpand>>(postId, {
    expand: 'user', // 同样，展开 `user` 信息以获取文章作者的完整资料。
  });
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
  // API 路由层应该在此函数被调用前，已完成对文章所有权的验证。
  return await pb.collection('posts').update<PBPostsResponse>(postId, data);
}

/**
 * 根据 ID 删除一篇文章。
 * @param pb 与当前请求上下文绑定的 PocketBase 实例（必须是已认证用户的实例）。
 * @param postId 要删除的文章的 ID。
 */
export async function deletePost(pb: TypedPocketBase, postId: string) {
  // API 路由层应该在此函数被调用前，已完成对文章所有权的验证。
  return await pb.collection('posts').delete(postId);
}

/**
 * 文章服务层
 */
// 💡 不再从 utils 导入全局 pb，而是导入类型
import type { PostExpand } from '~/types/posts';
import type { Create, Update, PostsResponse as PBPostsResponse, TypedPocketBase } from '~/types/pocketbase-types';

/**
 * 获取文章列表
 * @param pb 独立 PB 实例（由 API Handler 传入）
 */
export async function getPostsList(pb: TypedPocketBase, page: number = 1, perPage: number = 10) {
  // 💡 使用传入的 pb 实例，如果 event 中有身份，这里将自动应用 API Rules 权限校验
  return await pb.collection('posts').getList<PBPostsResponse<PostExpand>>(page, perPage, {
    sort: '-created',
    expand: 'user', // 与 PostExpand 结构对应
  });
}

/**
 * 获取单篇文章详情
 */
export async function getPostById(pb: TypedPocketBase, postId: string) {
  return await pb.collection('posts').getOne<PBPostsResponse<PostExpand>>(postId, {
    expand: 'user',
  });
}

/**
 * 创建新文章
 * @param pb 独立 PB 实例
 * @param data 使用 Create<'posts'> 确保提交字段符合数据库定义
 */
export async function createPost(pb: TypedPocketBase, data: Create<'posts'>) {
  // 💡 这里的创建操作会自动带上当前登录者的 Token
  return await pb.collection('posts').create<PBPostsResponse>(data);
}

/**
 * 更新文章
 * @param pb 独立 PB 实例
 * @param data 使用 Update<'posts'> 允许部分更新字段
 */
export async function updatePost(pb: TypedPocketBase, postId: string, data: Update<'posts'>) {
  return await pb.collection('posts').update<PBPostsResponse>(postId, data);
}
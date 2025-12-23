/**
 * 文章服务层
 */
import { pb } from '../utils/pocketbase';
import type { PostExpand } from '~/types/posts';
import type { Create, Update, PostsResponse as PBPostsResponse } from '~/types/pocketbase-types';

/**
 * 获取文章列表
 */
export async function getPostsList(page: number = 1, perPage: number = 10) {
  // 使用 PBPostsResponse<PostExpand> 确保返回结果中 expand 字段拥有正确类型
  return await pb.collection('posts').getList<PBPostsResponse<PostExpand>>(page, perPage, {
    sort: '-created',
    expand: 'user', // 与 PostExpand 结构对应
  });
}

/**
 * 获取单篇文章详情
 */
export async function getPostById(postId: string) {
  return await pb.collection('posts').getOne<PBPostsResponse<PostExpand>>(postId, {
    expand: 'user',
  });
}

/**
 * 创建新文章
 * @param data 使用 Create<'posts'> 确保提交字段符合数据库定义
 */
export async function createPost(data: Create<'posts'>) {
  return await pb.collection('posts').create<PBPostsResponse>(data);
}

/**
 * 更新文章
 * @param data 使用 Update<'posts'> 允许部分更新字段
 */
export async function updatePost(postId: string, data: Update<'posts'>) {
  return await pb.collection('posts').update<PBPostsResponse>(postId, data);
}

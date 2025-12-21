/**
 * 文章服务层
 */
import { pb } from '../utils/pocketbase';

/**
 * 获取文章列表
 * @param page 页码，默认为1
 * @param perPage 每页数量，默认为10
 * @returns 文章列表及分页信息
 */
export async function getPostsList(page: number = 1, perPage: number = 10) {
  return await pb.collection('posts').getList(page, perPage, {
    sort: '-created',
    expand: 'user',
  });
}

/**
 * 获取单篇文章详情
 * @param postId 文章ID
 * @returns 文章详情
 */
export async function getPostById(postId: string) {
  return await pb.collection('posts').getOne(postId, {
    expand: 'user',
  });
}

/**
 * 创建新文章
 * @param data 文章数据
 * @returns 创建的文章
 */
export async function createPost(data: any) {
  return await pb.collection('posts').create(data);
}

/**
 * 更新文章
 * @param postId 文章ID
 * @param data 更新数据
 * @returns 更新后的文章
 */
export async function updatePost(postId: string, data: any) {
  return await pb.collection('posts').update(postId, data);
}

/**
 * 评论服务层
 */
import { pb } from '../utils/pocketbase';

/**
 * 获取评论列表
 * @param page 页码，默认为1
 * @param perPage 每页数量，默认为20
 * @param filter 过滤条件，可选
 * @returns 评论列表及分页信息
 */
export async function getCommentsList(page: number = 1, perPage: number = 20, filter?: string) {
  const queryOptions: any = {
    sort: '-created',
    expand: 'user'
  };

  if (filter) {
    queryOptions.filter = filter;
  }

  return await pb.collection('comments').getList(
    page,
    perPage,
    queryOptions
  );
}

/**
 * 创建新评论
 * @param data 评论数据
 * @returns 创建的评论
 */
export async function createComment(data: any) {
  // 创建评论并返回包含用户信息的完整评论
  return await pb.collection('comments').create(data, {
    expand: 'user'
  });
}

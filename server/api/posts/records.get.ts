import { pb } from '../../utils/pocketbase';
import { handlePocketBaseError } from '../../utils/errorHandler';

export default defineEventHandler(async (event) => {
  try {
    // 获取 posts 记录列表，使用 getList 可以支持分页
    // 这里使用 page=1, perPage=50 获取前 50 条记录
    const { items: posts, totalItems, page, perPage } = await pb.collection('posts').getList(
      1, // page
      10, // perPage
      {
        // 可以添加排序、过滤等选项
        sort: '-created', // 按创建时间倒序
        // 可以包含关联的 user 数据
        expand: 'user'
      }
    );

    return {
      message: '获取文章列表成功',
      data: {
        posts,
        totalItems,
        page,
        perPage
      }
    };
  } catch (error) {
    handlePocketBaseError(error, '获取文章列表失败');
  }
});

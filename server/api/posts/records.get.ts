import { getPostsList } from '../../services/posts.service';
import { handlePocketBaseError } from '../../utils/errorHandler';

export default defineEventHandler(async (event) => {
  try {
    // 获取 posts 记录列表，使用服务层函数
    const { items: posts, totalItems, page, perPage } = await getPostsList(1, 10);

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

import { getPostById } from '../../../services/posts.service';
import { handlePocketBaseError } from '../../../utils/errorHandler';

export default defineEventHandler(async (event) => {
  try {
    // 1. 获取路由参数
    const postId = getRouterParam(event, 'id');

    // 2. 参数验证
    if (!postId) {
      throw createError({
        statusCode: 400,
        // 遵循新标准：message 存放中文，statusMessage 存放简短英文
        message: '文章 ID 不能为空',
        statusMessage: 'Bad Request',
      });
    }

    // 3. 调用服务层获取数据
    // 注意：如果 getPostById 内部没找到记录，PocketBase 通常会抛出 404
    const post = await getPostById(postId);

    // 4. 统一成功响应格式
    return {
      message: '获取文章详情成功',
      data: post,
    };
  } catch (error: any) {
    // 5. 统一错误处理
    // 如果是 404 (记录不存在)，handlePocketBaseError 会自动转换为友好的中文
    handlePocketBaseError(error, '该文章可能已被删除或不存在');
  }
});

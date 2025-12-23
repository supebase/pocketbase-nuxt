import { getPostById } from '../../../services/posts.service';
import { handlePocketBaseError } from '../../../utils/errorHandler';
// 导入业务响应类型
import type { PostsListResponse } from '~/types/posts';

export default defineEventHandler(async (event): Promise<PostsListResponse> => {
  try {
    // 1. 获取路由参数 (例如: /api/posts/abc123xyz)
    const postId = getRouterParam(event, 'id');

    // 2. 参数验证
    if (!postId) {
      throw createError({
        statusCode: 400,
        message: '文章 ID 无效或未提供',
        statusMessage: 'Invalid Parameter',
      });
    }

    // 3. 调用服务层获取数据
    // getPostById 内部已包含 expand: 'user'，并返回强类型的 PostRecord
    const post = await getPostById(postId);

    // 4. 返回符合 PostResponse 结构的标准化对象
    return {
      message: '获取内容详情成功',
      data: post as any, // 映射到业务层 PostRecord
    };
  } catch (error: any) {
    // 5. 统一错误处理
    // 如果文章不存在，PB 会抛出 404，此处会转换为“该文章可能已被删除或不存在”
    return handlePocketBaseError(error, '获取内容详情异常');
  }
});

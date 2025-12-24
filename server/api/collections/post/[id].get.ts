import { getPostById } from '../../../services/posts.service';
import { handlePocketBaseError } from '../../../utils/errorHandler';
import { getPocketBaseInstance } from '../../../utils/pocketbase'; // 💡 注入实例获取工具
// 导入业务响应类型
import type { SinglePostResponse } from '~/types/posts'; // 注意：单篇详情通常对应 SinglePostResponse

export default defineEventHandler(async (event): Promise<SinglePostResponse> => {
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

    // 3. 获取本次请求专用的独立 PB 实例 💡
    const pb = getPocketBaseInstance(event);

    // 4. 调用服务层获取数据 (传入 pb 实例) 💡
    const post = await getPostById(pb, postId);

    // 5. 返回标准化的业务响应对象
    return {
      message: '获取内容详情成功',
      data: post as any,
    };
  } catch (error: any) {
    // 6. 统一错误处理
    return handlePocketBaseError(error, '获取内容详情异常');
  }
});
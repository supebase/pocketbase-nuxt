import { deletePost, getPostById } from '../../../services/posts.service';
import { handlePocketBaseError } from '../../../utils/errorHandler';
import { getPocketBaseInstance } from '../../../utils/pocketbase'; // 💡 注入实例获取工具

export default defineEventHandler(async (event): Promise<{ message: string; data: any }> => {
  // 1. 身份校验 (Nuxt Session)
  const session = await getUserSession(event);
  const user = session?.user;

  if (!user?.id) {
    throw createError({
      statusCode: 401,
      message: '请先登录后再进行操作',
      statusMessage: 'Unauthorized',
    });
  }

  // 2. 获取参数
  const postId = getRouterParam(event, 'id');
  if (!postId) {
    throw createError({
      statusCode: 400,
      message: '删除 ID 不能为空',
    });
  }

  // 3. 获取独立的 PB 实例 💡
  const pb = getPocketBaseInstance(event);

  if (!pb.authStore.isValid) {
    throw createError({
      statusCode: 401,
      message: '身份认证已过期，请重新登录',
    });
  }

  try {
    // 4. 安全校验：检查文章是否存在且是否为当前用户所有
    // 💡 传入 pb 实例进行查询
    const existingPost = await getPostById(pb, postId);

    if ((existingPost as any).user !== user.id) {
      throw createError({
        statusCode: 403,
        message: '您没有权限删除此内容',
        statusMessage: 'Forbidden',
      });
    }

    // 5. 执行删除 💡 传入 pb 实例
    const post = await deletePost(pb, postId);

    return {
      message: '内容已成功删除',
      data: post as any,
    };
  } catch (error) {
    return handlePocketBaseError(error, '内容删除异常');
  }
});

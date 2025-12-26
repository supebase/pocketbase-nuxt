import { deleteComment, getCommentById } from '../../../services/comments.service';
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
    const commentId = getRouterParam(event, 'id');
    if (!commentId) {
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
        // 4. 安全校验：检查评论是否存在且是否为当前用户所有
        // 💡 传入 pb 实例进行查询
        const existingComment = await getCommentById(pb, commentId);

        if ((existingComment as any).user !== user.id) {
            throw createError({
                statusCode: 403,
                message: '您没有权限删除此评论',
                statusMessage: 'Forbidden',
            });
        }

        // 5. 执行删除 💡 传入 pb 实例
        const comment = await deleteComment(pb, commentId);

        return {
            message: '评论已成功删除',
            data: comment as any,
        };
    } catch (error) {
        return handlePocketBaseError(error, '评论删除异常');
    }
});
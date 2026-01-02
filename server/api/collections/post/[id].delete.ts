/**
 * @file API Route: /api/collections/post/:id [DELETE]
 * @description 删除单篇内容（文章）的 API 端点。
 *              执行严格的权限验证，确保只有文章的创建者本人才能删除该文章。
 */
import { deletePost } from '../../../services/posts.service';
import { defineApiHandler } from '~~/server/utils/api-wrapper';

/**
 * 定义处理删除文章请求的事件处理器。
 */
export default defineApiHandler(async (event): Promise<{ message: string; data: any }> => {
	// 步骤 1: 进行身份验证，确保用户已登录。
	// 新增: 从事件上下文中获取用户信息
	// 认证逻辑已由中间件统一处理，此处可安全地使用非空断言 `!`。
	const pb = event.context.pb;

	// 步骤 2: 从路由参数中获取要删除的文章 ID。
	const postId = getRouterParam(event, 'id');
	if (!postId) {
		// 如果 ID 不存在，这是一个无效请求。
		throw createError({
			statusCode: 400,
			message: '删除 ID 不能为空',
		});
	}

	const post = await deletePost(pb, postId);

	return {
		message: '内容已成功删除',
		data: post as any,
	};
});

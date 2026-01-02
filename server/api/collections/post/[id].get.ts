/**
 * @file API Route: /api/collections/post/:id [GET]
 * @description 获取单篇内容（文章）详情的 API 端点。
 */
import { getPostById } from '../../../services/posts.service';
import { defineApiHandler } from '~~/server/utils/api-wrapper';
import type { SinglePostResponse } from '~/types/posts';

/**
 * 定义处理获取单篇文章详情请求的事件处理器。
 */
export default defineApiHandler(async (event): Promise<SinglePostResponse> => {
	// 步骤 1: 从动态路由中获取文章的 ID。
	const postId = getRouterParam(event, 'id');

	// 步骤 2: 对获取到的 ID 进行基础的有效性验证。
	if (!postId) {
		throw createError({
			statusCode: 400,
			message: '文章 ID 无效或未提供',
			statusMessage: 'Invalid Parameter',
		});
	}

	// 步骤 3: 获取本次请求专用的 PocketBase 实例。
	// 实例可以是匿名的，也可以是认证过的，服务层可以根据此来决定数据访问权限。
	const pb = event.context.pb;

	// 步骤 4: 调用服务层的 `getPostById` 函数来执行实际的数据库查询。
	// 传入 `pb` 实例和 `postId`，将具体的查询逻辑与 API 路由解耦。
	const post = await getPostById(pb, postId);

	return {
		message: '获取内容详情成功',
		data: post as any,
	};
});

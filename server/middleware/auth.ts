/**
 * @file /server/middleware/auth.ts
 * @description 身份认证中间件 (Authentication Middleware)。
 *              该中间件会在处理受保护的 API 路由之前执行，集中处理用户身份验证逻辑。
 */

/**
 * 定义一个需要身份验证的路由和方法的列表。
 * 这使得认证逻辑与 API 路由处理程序本身分离，提高了代码的模块化和可维护性。
 */
import { getPocketBase } from '../utils/pocketbase';

const protectedRoutes = [
	{ path: '/api/collections/posts', method: 'POST' },
	{ path: '/api/collections/post', method: ['PUT', 'DELETE'], isPrefix: true },
	{ path: '/api/collections/comments', method: 'POST' },
	{ path: '/api/collections/comment', method: 'DELETE', isPrefix: true },
	{ path: '/api/collections/likes', method: 'POST' },
];

export default defineEventHandler(async (event) => {
	const url = getRequestURL(event).pathname.replace(/\/$/, '') || '/';
	const method = event.method;

	// 1. 无论是否是受保护路由，先尝试初始化用户信息
	// 这样 event.context.user 就能在后续的 API 处理程序中使用了
	const pb = getPocketBase(event);
	event.context.pb = pb;

	// 2. 身份解析
	if (pb.authStore.isValid && pb.authStore.record) {
		// 注入用户信息
		event.context.user = pb.authStore.record;
	}

	// 3. 路由保护逻辑
	const isProtected = protectedRoutes.some((route) => {
		// 处理方法匹配：支持单字符串或数组
		const methodMatch = Array.isArray(route.method)
			? route.method.includes(method)
			: method === route.method;

		if (!methodMatch) return false;

		// 处理路径匹配
		if (route.isPrefix) {
			// 确保是真正的目录层级匹配，防止 /post-list 匹配到 /post/
			return url === route.path || url.startsWith(`${route.path}/`);
		}

		// 精确匹配
		return url === route.path;
	});

	if (isProtected && !event.context.user) {
		throw createError({
		statusCode: 401,
		statusMessage: 'Unauthorized',
		message: '此操作需要登录',
		});
  }
});

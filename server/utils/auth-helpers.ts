/**
 * @file 服务端认证辅助函数
 * @description 该文件包含了处理用户认证成功后的通用逻辑，
 *              旨在统一管理 Nuxt Session 和 PocketBase Cookie，确保前后端状态一致。
 */
import type { H3Event } from 'h3';
import type { TypedPocketBase } from '~/types/pocketbase-types';
import type { UserRecord, AuthResponse } from '~/types/auth';

/**
 * 统一处理用户认证成功后的核心逻辑。
 * 主要职责是：在用户成功登录或注册后，同时创建并维持 Nuxt 的服务端会话 (Session)
 * 和 PocketBase 的客户端身份凭证 (Cookie)，以确保双重认证状态的同步。
 *
 * @param event H3Event 对象，代表当前的 HTTP 请求上下文，用于设置 Session 和响应头。
 * @param pb 一个已经通过用户凭证完成认证的 PocketBase 实例。
 * @param successMessage 一个描述操作成功的消息字符串，例如 "登录成功" 或 "注册成功"。
 * @returns 返回一个标准化的 AuthResponse 对象，其中包含成功消息和用户信息。
 */
export async function handleAuthSuccess(event: H3Event, pb: TypedPocketBase, successMessage: string): Promise<AuthResponse> {
	// 从 PocketBase 的认证存储中获取刚刚完成认证的用户记录。
	const pbUser = pb.authStore.record as unknown as UserRecord;

	// 步骤 1: 构造用于 Session 和 API 响应的用户信息载荷 (Payload)。
	// 这里只选取客户端和 Nuxt Session 需要的、可以安全暴露的字段，避免泄露敏感信息。
	const userPayload: UserRecord = { id: pbUser.id, email: pbUser.email, name: pbUser.name, avatar: pbUser.avatar, verified: pbUser.verified, location: pbUser.location };

	// 步骤 2: 创建或更新 Nuxt 的服务端 Session。
	// `setUserSession` 是 `nuxt-auth-utils` 提供的函数，它会将用户信息加密并存储在服务端的 Session Cookie 中。
	// 这使得我们可以在服务端渲染 (SSR) 和服务端 API 路由中通过 `getUserSession` 快速获取用户信息。
	await setUserSession(event, {
		user: userPayload,
		loggedInAt: new Date().toISOString(),
	});

	// 步骤 3: 将 PocketBase 的认证 Token 导出为 Cookie，并附加到响应头中。
	// 这个 Cookie 主要供客户端 JavaScript 使用，特别是 PocketBase 的 JS SDK 和 WebSocket 实时通信。
	const MAX_AGE = 60 * 60 * 24 * 7; // 7 天

	const pbCookie = pb.authStore.exportToCookie(
		{
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'Lax',
			path: '/',
			maxAge: MAX_AGE,
		},
		'pb_auth'
	);

	// 将生成的 `Set-Cookie` 字符串附加到当前请求的响应头中，浏览器会自动保存这个 Cookie。
	appendResponseHeader(event, 'Set-Cookie', pbCookie);

	// 步骤 4: 构建并返回一个结构化的成功响应给前端。
	return {
		message: successMessage,
		data: {
			// 将用户信息一并返回，方便前端立即更新 UI 状态。
			user: userPayload,
		},
	};
}

/**
 * @file API Route: /api/auth/register [POST]
 * @description 用户注册的 API 端点。
 *              接收用户的注册信息，调用认证服务创建新用户，
 *              并在成功后自动为用户登录并建立会话。
 */
import { getPocketBase } from '../../utils/pocketbase';
import { handleAuthSuccess } from '../../utils/auth-helpers';
import { defineApiHandler } from '~~/server/utils/api-wrapper';
import type { RegisterRequest, AuthResponse } from '~/types/auth';

/**
 * 定义处理用户注册请求的事件处理器。
 */
export default defineApiHandler(async (event): Promise<AuthResponse> => {
	// 步骤 1: 从请求体中异步读取 JSON 数据，并断言其类型为 `RegisterRequest`。
	const body = await readBody<RegisterRequest>(event);
	const { email, password, passwordConfirm, location } = body;

	// 步骤 2: 在将请求传递给服务层之前，进行前置的、基本的输入验证。
	// 检查所有必需字段是否存在。
	if (!email || !password || !passwordConfirm) {
		throw createError({
			statusCode: 400,
			message: '请填写完整的注册信息',
			statusMessage: 'Incomplete Information',
		});
	}

	// 检查两次输入的密码是否一致。
	if (password !== passwordConfirm) {
		throw createError({
			statusCode: 400,
			message: '两次输入的密码不一致',
			statusMessage: 'Validation Error',
		});
	}

	// 步骤 3: 为本次 HTTP 请求获取一个独立的 PocketBase 实例。
	const pb = getPocketBase(event);

	// 步骤 4: 调用服务层的 `registerService`，传入 `pb` 实例和注册信息。
	// `registerService` 内部会执行两个关键操作：
	//   a. 调用 `pb.collection('users').create()` 创建新用户。
	//   b. 紧接着调用 `loginService(pb, ...)`，使用新创建的账户信息进行登录。
	//      这使得我们传入的这个 `pb` 实例的 `authStore` 被填充了新用户的认证信息。
	await registerService(pb, email, password, passwordConfirm, location);

	// 步骤 5: 注册和自动登录成功后，调用统一的成功处理器 `handleAuthSuccess`。
	// 我们将包含了新用户认证信息的 `pb` 实例传递给它，它会负责设置 Session、Cookie 并返回标准响应。
	return await handleAuthSuccess(event, pb, '注册成功');
});

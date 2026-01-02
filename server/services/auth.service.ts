/**
 * @file 用户认证服务层 (Auth Service)
 * @description 该文件封装了所有与用户身份认证相关的核心业务逻辑，
 *              包括登录、注册和登出。服务层不直接处理 HTTP 请求和响应，
 *              而是专注于执行具体的业务操作，并供上层的 API handlers 调用。
 */
import { getMd5Hash } from '../utils/md5-hash';
import { normalizeEmail, formatDefaultName } from '~/utils/index';
import type { UsersResponse, Create, TypedPocketBase } from '~/types/pocketbase-types';
import type { H3Event } from 'h3';

/**
 * 用户登录服务。
 * @param pb 由上层 API handler 传入的、与当前请求绑定的 PocketBase 实例。
 * @param email 用户的电子邮件地址。
 * @param password 用户的明文密码。
 * @returns 返回成功登录后的用户记录 (UsersResponse)。如果认证失败，PocketBase SDK 会自动抛出错误。
 */
export async function loginService(pb: TypedPocketBase, email: string, password: string): Promise<UsersResponse> {
	// 对邮箱进行标准化处理（例如，去除多余空格），确保认证的一致性。
	const cleanEmail = normalizeEmail(email);

	// 调用 PocketBase SDK 的 `authWithPassword` 方法执行认证。
	// 成功后，用户的认证信息（包括 token 和用户数据）会自动存储在传入的 `pb` 实例的 `authStore` 中。
	// 这是实现状态传递的关键一步。
	const authData = await pb.collection('users').authWithPassword<UsersResponse>(cleanEmail, password);

	// 返回完整的用户记录数据。
	return authData.record;
}

/**
 * 用户注册服务。
 * @param pb 由上层 API handler 传入的 PocketBase 实例。
 * @param email 用户注册时使用的电子邮件地址。
 * @param password 用户的明文密码。
 * @param passwordConfirm 用户的确认密码。
 * @returns 返回新注册并自动登录后的用户记录。
 */
export async function registerService(pb: TypedPocketBase, email: string, password: string, passwordConfirm: string, location: string): Promise<UsersResponse> {
	// 1. 准备新用户数据
	const cleanEmail = normalizeEmail(email);
	const md5Hash = getMd5Hash(cleanEmail);
	const rawName = cleanEmail.split('@')[0];
	const defaultName = formatDefaultName(rawName);

	// 2. 构建符合 PocketBase 'users' 集合 `create` 操作的数据结构。
	// 使用 `Omit<Create<'users'>, 'tokenKey'>` 类型可以获得很好的类型提示和安全保证。
	const newUser: Omit<Create<'users'>, 'tokenKey'> = {
		email: cleanEmail,
		password,
		passwordConfirm,
		avatar: md5Hash,
		name: defaultName,
		location,
	};

	// 3. 调用 PocketBase SDK 的 `create` 方法在 'users' 集合中创建新记录。
	// 如果邮箱已存在、密码不匹配等，SDK 会自动抛出 ClientResponseError。
	await pb.collection('users').create(newUser);

	// 4. 实现 "注册后自动登录" 的逻辑。
	// 直接复用 `loginService`，并传入同一个 `pb` 实例。
	// 因为 `loginService` 会将认证结果存入此 `pb` 实例的 `authStore`，
	// 所以上层调用者可以从这个 `pb` 实例中获取到新用户的登录状态。
	return await loginService(pb, cleanEmail, password);
}

/**
 * 用户登出服务。
 * @param pb 与当前请求绑定的 PocketBase 实例。
 * @returns Promise<void>
 */
export async function logoutService(event: H3Event, pb: TypedPocketBase): Promise<void> {
	// 调用 PocketBase 认证存储的 `clear` 方法。
	// 这会清除当前 `pb` 实例内存中的认证 token 和用户模型。
	// 注意：这本身是一个无状态的操作，它只影响这个在单次请求中创建的 `pb` 实例。
	// 真正的登出效果依赖于上层 API handler 清除浏览器端的认证 Cookie。
	pb.authStore.clear();

	// 清理服务端 Session (nuxt-auth-utils)
	await clearUserSession(event);

	// 清理客户端 Cookie (PocketBase SDK 依赖)
	deleteCookie(event, 'pb_auth', {
		path: '/',
	});
}

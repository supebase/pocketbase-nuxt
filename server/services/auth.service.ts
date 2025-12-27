/**
 * 认证服务层
 */
import { getMd5Hash } from '../utils/pocketbase';
import { normalizeEmail, formatDefaultName } from '~/utils/index';
// 导入生成的类型和业务模型
import type { UsersResponse, Create, TypedPocketBase } from '~/types/pocketbase-types';

/**
 * 用户登录服务
 * @param pb 传入由 API Handler 创建的独立 PB 实例
 */
export async function loginService(
  pb: TypedPocketBase,
  email: string,
  password: string
): Promise<UsersResponse> {
  const cleanEmail = normalizeEmail(email);

  // 执行认证，结果会存储在传入的 pb 实例的 authStore 中
  const authData = await pb
    .collection('users')
    .authWithPassword<UsersResponse>(cleanEmail, password);

  return authData.record;
}

/**
 * 用户注册服务
 * @param pb 传入由 API Handler 创建的独立 PB 实例
 */
export async function registerService(
  pb: TypedPocketBase,
  email: string,
  password: string,
  passwordConfirm: string
): Promise<UsersResponse> {
  const cleanEmail = normalizeEmail(email);
  const md5Hash = getMd5Hash(cleanEmail);
  const rawName = cleanEmail.split('@')[0];
  const defaultName = formatDefaultName(rawName);

  // 使用 Create<'users'> 类型约束
  const newUser: Omit<Create<'users'>, 'tokenKey'> = {
    email: cleanEmail,
    password,
    passwordConfirm,
    avatar: md5Hash,
    name: defaultName,
  };

  // 1. 创建用户
  await pb.collection('users').create(newUser);

  // 2. 自动登录（传入相同的 pb 实例，确保 Token 状态被保留）
  return await loginService(pb, cleanEmail, password);
}

/**
 * 用户登出服务
 * 注：由于是 Stateless 无状态请求，服务端的 clear 其实只影响当前请求实例，
 * 真正的登出逻辑主要由 API Handler 清理 Cookie 完成。
 */
export async function logoutService(pb: TypedPocketBase): Promise<void> {
  pb.authStore.clear();
}

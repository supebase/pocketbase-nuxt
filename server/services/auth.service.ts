/**
 * 认证服务层
 */
import { pb, getMd5Hash } from '../utils/pocketbase';
import { normalizeEmail, formatDefaultName } from '~/utils/index';
// 导入生成的类型和业务模型
import type { UsersResponse, Create } from '~/types/pocketbase-types';

/**
 * 用户登录服务
 */
export async function loginService(email: string, password: string): Promise<UsersResponse> {
  const cleanEmail = normalizeEmail(email);

  // 使用泛型确保 authData.record 是 UsersResponse 类型
  const authData = await pb
    .collection('users')
    .authWithPassword<UsersResponse>(cleanEmail, password);

  return authData.record;
}

/**
 * 用户注册服务
 */
export async function registerService(
  email: string,
  password: string,
  passwordConfirm: string
): Promise<UsersResponse> {
  const cleanEmail = normalizeEmail(email);
  const md5Hash = getMd5Hash(cleanEmail);
  const rawName = cleanEmail.split('@')[0];
  const defaultName = formatDefaultName(rawName);

  const newUser: Omit<Create<'users'>, 'tokenKey'> = {
    email: cleanEmail,
    password,
    passwordConfirm,
    avatar: md5Hash,
    name: defaultName,
  };

  // 1. 创建用户
  await pb.collection('users').create(newUser);

  // 2. 自动登录
  return await loginService(cleanEmail, password);
}

/**
 * 用户登出服务
 */
export async function logoutService(): Promise<void> {
  pb.authStore.clear();
}

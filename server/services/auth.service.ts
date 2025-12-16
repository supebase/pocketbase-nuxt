/**
 * 认证服务层
 */
import { pb, getMd5Hash } from '../utils/pocketbase';

/**
 * 用户登录服务
 * @param email 电子邮件
 * @param password 密码
 * @returns 认证数据
 */
export async function loginService(email: string, password: string) {
  const authData = await pb.collection("users").authWithPassword(email, password);
  return authData.record;
}

/**
 * 用户注册服务
 * @param email 电子邮件
 * @param password 密码
 * @param passwordConfirm 确认密码
 * @returns 认证数据
 */
export async function registerService(email: string, password: string, passwordConfirm: string) {
  const md5Hash = getMd5Hash(email);
  const defaultName = email.split("@")[0];

  // 创建用户
  await pb.collection("users").create({
    email,
    password,
    passwordConfirm,
    avatar: md5Hash,
    name: defaultName,
  });

  // 自动登录
  const authData = await pb.collection("users").authWithPassword(email, password);
  return authData.record;
}

/**
 * 用户登出服务
 */
export async function logoutService() {
  pb.authStore.clear();
}

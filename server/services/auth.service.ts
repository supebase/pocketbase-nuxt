/**
 * 认证服务层
 */
import { pb, getMd5Hash } from '../utils/pocketbase';
import { normalizeEmail, formatDefaultName } from '~/utils/index';

/**
 * 用户登录服务
 * @param email 电子邮件
 * @param password 密码
 * @returns 认证数据
 */
export async function loginService(email: string, password: string) {
  const cleanEmail = normalizeEmail(email);
  const authData = await pb.collection("users").authWithPassword(cleanEmail, password);
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
  // 1. 预处理邮箱
  const cleanEmail = normalizeEmail(email);

  // 2. 基于干净的邮箱生成 MD5
  const md5Hash = getMd5Hash(cleanEmail);

  // 3. 处理默认用户名 (例如: "john.doe" -> "John.doe")
  const rawName = cleanEmail.split("@")[0];
  const defaultName = formatDefaultName(rawName);

  // 创建用户
  await pb.collection("users").create({
    email: cleanEmail,
    password,
    passwordConfirm,
    avatar: md5Hash,
    name: defaultName,
  });

  // 自动登录使用同样的 cleanEmail
  const authData = await pb.collection("users").authWithPassword(cleanEmail, password);
  return authData.record;
}

/**
 * 用户登出服务
 */
export async function logoutService() {
  pb.authStore.clear();
}

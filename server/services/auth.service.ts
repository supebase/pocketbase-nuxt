/**
 * @file Auth Service
 * @description 封装用户认证逻辑（登录、注册、登出），解耦 API handler 与 PocketBase SDK 操作。
 */
import { H3Event } from 'h3';
import { normalizeEmail, formatDefaultName } from '~/utils/index';
import type { UsersResponse, Create, LoginOptions, RegisterOptions, LogoutOptions, TypedPocketBase } from '~/types';

/**
 * 用户登录
 * @returns 成功后返回 PocketBase 用户记录，认证信息将同步更新至 pb.authStore
 */
export async function loginService({
  pb,
  email,
  password,
  event,
}: LoginOptions & { event: H3Event }): Promise<UsersResponse> {
  const cleanEmail = normalizeEmail(email);
  await clearUserSession(event);
  const authData = await pb.collection('users').authWithPassword<UsersResponse>(cleanEmail, password);

  await setUserSession(event, {
    user: authData.record,
    loggedInAt: new Date().toISOString(),
  });

  return authData.record;
}

/**
 * 用户注册
 * @description 完成用户创建并自动执行登录操作
 */
export async function registerService({
  pb,
  email,
  password,
  passwordConfirm,
  location,
  event,
}: RegisterOptions & { event: H3Event }): Promise<UsersResponse> {
  const cleanEmail = normalizeEmail(email);
  const emailHash = getEmailHash(cleanEmail);
  const rawName = cleanEmail.split('@')[0] || '';
  const defaultName = formatDefaultName(rawName);

  const newUser: Omit<Create<'users'>, 'tokenKey'> = {
    email: cleanEmail,
    password,
    passwordConfirm,
    avatar: emailHash,
    name: defaultName,
    location,
  };

  try {
    await pb.collection('users').create(newUser);
    // 注册成功后自动调用登录服务，复用 authStore 状态
    return await loginService({ pb, email: cleanEmail, password, event });
  } catch (error: any) {
    // 注册过程中任何一步失败，都要彻底清理现场
    pb.authStore.clear();
    await clearUserSession(event);

    // 重新抛出错误，让 API Handler 捕获并返回给前端
    throw error;
  }
}

/**
 * 用户登出
 * @description 清除 PocketBase 内存状态、服务端 Session 及客户端 Cookie
 */
export async function logoutService({ event, pb }: LogoutOptions & { event: H3Event }): Promise<void> {
  // 清除当前 pb 实例的认证信息
  pb.authStore.clear();

  // 清理服务端 Session (nuxt-auth-utils)
  await clearUserSession(event);

  // 移除浏览器 pb_auth Cookie
  deleteCookie(event, 'pb_auth', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}

/**
 * GitHub OAuth2 登录服务
 */
export async function githubLoginService({
  pb,
  code,
  codeVerifier,
  redirectUrl,
  event,
}: {
  pb: TypedPocketBase;
  code: string;
  codeVerifier: string;
  redirectUrl: string;
  event: H3Event;
}): Promise<UsersResponse> {
  // 清理旧 Session
  await clearUserSession(event);

  // 使用 code 交换 PocketBase 的 AuthData
  // PocketBase 会自动处理：如果用户不存在则创建，如果存在则登录
  try {
    const authData = await pb
      .collection('users')
      .authWithOAuth2Code<UsersResponse>('github', code, codeVerifier, redirectUrl);

    // 更新 Nuxt Session
    await setUserSession(event, {
      user: authData.record,
      loggedInAt: new Date().toISOString(),
    });

    return authData.record;
  } catch (error) {
    await clearUserSession(event);
    throw error;
  }
}

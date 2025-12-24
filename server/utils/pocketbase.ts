import PocketBase from 'pocketbase';
import type { TypedPocketBase } from '~/types/pocketbase-types';
import { createHash } from 'node:crypto';
import type { H3Event } from 'h3';

/**
 * 获取一个安全的 PocketBase 实例
 * @param event 如果传入 event，将自动从请求 Cookie 中加载身份状态
 */
export function getPocketBaseInstance(event?: H3Event) {
  const config = useRuntimeConfig();
  // 使用服务端私有的后端 URL
  const pb = new PocketBase(config.pocketbaseBackend) as TypedPocketBase;

  pb.autoCancellation(false);

  if (event) {
    // 尝试从 Cookie 中恢复 PocketBase 的认证状态
    const authCookie = getCookie(event, 'pb_auth');
    if (authCookie) {
      pb.authStore.loadFromCookie(`pb_auth=${authCookie}`);
    }
  }

  return pb;
}

/**
 * 服务器端 MD5 Hashing
 */
export function getMd5Hash(email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  return createHash('md5').update(normalizedEmail).digest('hex');
}
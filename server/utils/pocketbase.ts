import PocketBase from 'pocketbase';
import type { TypedPocketBase } from '~/types/pocketbase-types';
import { createHash } from 'node:crypto';

const config = useRuntimeConfig();
const POCKETBASE_URL = config.pocketbaseUrl;

if (!POCKETBASE_URL) {
  throw new Error('POCKETBASE_URL 未配置正确');
}

export const pb = new PocketBase(POCKETBASE_URL as string).autoCancellation(
  false
) as TypedPocketBase;

/**
 * 服务器端 MD5 Hashing (使用 Node.js 内置 crypto)
 * @param email 用户的原始邮箱
 * @returns MD5 散列值 (32位十六进制)
 */
export function getMd5Hash(email: string): string {
  const normalizedEmail = email.trim().toLowerCase();

  return createHash('md5').update(normalizedEmail).digest('hex');
}

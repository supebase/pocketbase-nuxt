import PocketBase from 'pocketbase';
import { createHash } from "node:crypto";

const config = useRuntimeConfig();
const POCKETBASE_URL = config.public.POCKETBASE_URL;

if (!POCKETBASE_URL) {
    throw new Error('POCKETBASE_URL is not set in runtimeConfig');
}

export const pb = new PocketBase(POCKETBASE_URL as string);

// 可选：确保服务端 PB 客户端始终处于非认证状态
// pb.authStore.clear(); 
// 如果在 server/api 中使用，每次请求都是一个新的上下文，通常不需要这一步。

/**
 * 服务器端 MD5 Hashing (使用 Node.js 内置 crypto)
 * @param email 用户的原始邮箱
 * @returns MD5 散列值 (32位十六进制)
 */
export function getMd5Hash(email: string): string {
    const normalizedEmail = email.trim().toLowerCase()

    return createHash('md5')
        .update(normalizedEmail)
        .digest('hex')
}
import PocketBase from 'pocketbase';
import { createHash } from "node:crypto";

// 运行时配置，获取在 nuxt.config.ts 中定义的 public.POCKETBASE_URL
const config = useRuntimeConfig();
const POCKETBASE_URL = config.public.POCKETBASE_URL;

// 创建 PocketBase 实例
// 确保 POCKETBASE_URL 已在 .env 文件中设置
if (!POCKETBASE_URL) {
    throw new Error('POCKETBASE_URL is not set in runtimeConfig');
}

export const pb = new PocketBase(POCKETBASE_URL as string);

// 可选：定义 Record 模型以获得更强的类型提示
// 假设您的 users collection 至少有 id, email, name
export interface PocketbaseUser {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    // ... 其他字段
}

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
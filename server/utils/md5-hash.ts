import { createHash } from 'node:crypto';

/**
 * 为给定的电子邮箱地址生成 MD5 哈希值，主要用于获取 Gravatar 全球通用头像。
 * @param email 需要计算哈希的邮箱地址字符串。
 * @returns 返回一个 32 位的十六进制 MD5 哈希字符串。
 */
export function getMd5Hash(email: string): string {
	// 根据 Gravatar 的要求，在生成哈希前需要对邮箱地址进行标准化处理：
	// 1. `trim()`: 去除地址前后可能存在的空白字符。
	// 2. `toLowerCase()`: 将整个邮箱地址转换为小写。
	const normalizedEmail = email.trim().toLowerCase();

	// 使用 Node.js 的 crypto 模块来执行 MD5 哈希计算。
	// `update()` 添加要哈希的数据，`digest('hex')` 输出十六进制格式的哈希结果。
	return createHash('md5').update(normalizedEmail).digest('hex');
}

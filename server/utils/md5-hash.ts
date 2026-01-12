/**
 * @file Crypto Utility
 * @description 提供基础的加密/哈希功能。
 */

import { createHash } from 'node:crypto';

/**
 * 生成邮箱的 MD5 哈希值
 * @description 常用于 Gravatar 头像匹配。逻辑：去除首尾空格 -> 转换为小写 -> MD5 加密
 * @param email - 待处理的原始邮箱地址
 */
export function getMd5Hash(email: string): string {
  // Gravatar 规范：哈希前必须进行首尾修剪和小写化
  const normalizedEmail = email.trim().toLowerCase();

  return createHash('md5').update(normalizedEmail).digest('hex');
}

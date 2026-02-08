/**
 * @file Permission Guard
 * @description 资源所有权校验工具，确保当前登录用户仅能操作属于自己的数据。
 */

import type { TypedPocketBase, CollectionResponses } from '~/types';

/**
 * 强类型所有权校验
 * @template T - 集合名称类型（由参数自动推导）
 * @param collectionName - PocketBase 集合名
 * @param resourceId - 待操作的资源 ID
 * @param userField - 关联用户 ID 的字段名，默认为 'user'
 * @description
 * 1. 自动从 pb.authStore 获取当前用户。
 * 2. 校验资源所属关系，若不匹配则抛出 403 错误。
 * @returns 校验成功后返回完整的强类型资源记录
 */
export async function ensureOwnership<T extends keyof CollectionResponses>(
  pb: TypedPocketBase,
  collectionName: T,
  resourceId: string,
  // 关键优化：限制 userField 必须是该集合类型中的有效键
  userField: keyof CollectionResponses[T] = 'user' as keyof CollectionResponses[T],
): Promise<CollectionResponses[T]> {
  // 获取目标记录（基于泛型 T 自动推导返回类型）
  const record = await pb.collection(collectionName).getOne(resourceId);

  // 获取当前认证用户状态
  const currentUser = pb.authStore.record;
  const fieldValue = record[userField];

  // 核心鉴权逻辑优化
  // 确保用户已登录
  // 确保字段值是字符串（ID）且与当前用户 ID 完全匹配
  const isOwner = currentUser?.id && typeof fieldValue === 'string' && fieldValue === currentUser.id;

  if (!isOwner) {
    throw createError({
      status: 403,
      message: '无权操作：您不是该内容的所有者',
      statusText: 'Forbidden',
    });
  }

  return record;
}

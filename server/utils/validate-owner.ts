import type { TypedPocketBase, CollectionResponses } from '~/types/pocketbase-types';

/**
 * 通用所有权校验函数 (Type-Safe Version)
 * * @template T - 自动推导的集合名称类型 (如 'posts' | 'comments')
 * @param pb - PocketBase 实例
 * @param collectionName - 集合名称，必须是 schema 中定义的有效名称
 * @param resourceId - 资源 ID
 * @param userField - 存储用户 ID 的字段名 (默认为 'user')。TS 会强制检查该字段是否存在于对应集合中。
 * @returns 返回查找到的强类型资源记录
 */
export async function ensureOwnership<T extends keyof CollectionResponses>(
  pb: TypedPocketBase,
  collectionName: T,
  resourceId: string,
  // 关键优化：限制 userField 必须是该集合类型中的有效键
  userField: keyof CollectionResponses[T] = 'user' as keyof CollectionResponses[T],
): Promise<CollectionResponses[T]> {
  // 1. 获取资源记录 (返回类型自动推导为 CollectionResponses[T])
  const record = await pb.collection(collectionName).getOne(resourceId);

  // 2. 获取当前登录用户
  const currentUser = pb.authStore.record;

  // 3. 安全检查：运行时确认字段是否存在
  // 防止虽然类型强转骗过了编译器，但数据库 schema 实际并不存在该字段的情况
  if (!(userField in record)) {
    console.error(`校验 '${String(userField)}' 字段不存在于集合 '${collectionName}'`);
    throw createError({
      statusCode: 500,
      message: '服务器内部配置错误: 校验字段不存在',
    });
  }

  // 4. 核心校验逻辑
  // 强制转换为 String 进行比较，防止某些特殊情况下类型不一致
  if (!currentUser || String(record[userField]) !== currentUser.id) {
    throw createError({
      statusCode: 403,
      message: '您没有权限操作此内容',
    });
  }

  return record;
}

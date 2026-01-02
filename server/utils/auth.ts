import type { TypedPocketBase } from '~/types/pocketbase-types';

/**
 * 通用所有权校验函数
 * @param pb PocketBase 实例
 * @param collectionName 集合名称 (如 'posts', 'comments')
 * @param resourceId 资源 ID
 * @param userField 存储用户 ID 的字段名，默认为 'user'
 * @returns 返回查找到的资源记录
 */
export async function ensureOwnership(pb: TypedPocketBase, collectionName: string, resourceId: string, userField: string = 'user') {
    // 1. 获取资源记录
    const record = await pb.collection(collectionName).getOne(resourceId);

    // 2. 获取当前登录用户
    const currentUser = pb.authStore.record;

    // 3. 校验逻辑：必须登录 且 记录的作者是当前用户
    if (!currentUser || record[userField] !== currentUser.id) {
        throw createError({
            statusCode: 403,
            message: '您没有权限操作此内容',
        });
    }

    return record;
}
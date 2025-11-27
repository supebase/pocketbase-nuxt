import type { BaseModel } from "pocketbase";
import type { ClientResponseError } from "pocketbase";

// 定义通用的头像错误信息的结构
interface AvatarError {
    isError: true;
    message: string; // 用于顶层的通用错误提示
    // errors 结构为 { fieldName: { code: string, message: string } }
    errors?: Record<string, { code: string; message: string }>;
}

/**
 * 头像管理 Composable
 */
export const useAvatar = () => {
    // 获取 PocketBase 客户端实例
    const { pbClient } = usePocketbase();

    // --- 核心功能函数 ---

    /**
     * 上传用户头像
     * @param file 要上传的头像文件
     * @returns {Promise<BaseModel | AvatarError>} 成功返回更新后的用户记录，失败返回错误对象
     */
    const uploadAvatar = async (file: File): Promise<BaseModel | AvatarError> => {
        try {
            // 获取当前认证用户
            const currentUser = pbClient.authStore.record as BaseModel | null;
            
            if (!currentUser) {
                return {
                    isError: true,
                    message: '用户未登录'
                };
            }

            // 创建表单数据
            const formData = new FormData();
            formData.append('avatar', file);

            // 更新用户记录，PocketBase 会自动处理旧头像的删除
            const updatedUser = await pbClient.collection('users').update(currentUser.id, formData);

            // 更新认证存储中的用户记录
            pbClient.authStore.save(pbClient.authStore.token, updatedUser);

            return updatedUser;
        } catch (e) {
            const error = e as ClientResponseError;

            // 检查是否是 PocketBase 返回的结构化验证错误
            if (error.status === 400 && error.response?.data) {
                return {
                    isError: true,
                    message: '头像上传验证失败，请检查输入。',
                    errors: error.response.data as AvatarError['errors']
                };
            }

            // 捕获其他错误
            return {
                isError: true,
                message: error.message || '头像上传过程中发生未知错误。',
            };
        }
    };

    /**
     * 删除用户头像
     * @returns {Promise<BaseModel | AvatarError>} 成功返回更新后的用户记录，失败返回错误对象
     */
    const deleteAvatar = async (): Promise<BaseModel | AvatarError> => {
        try {
            // 获取当前认证用户
            const currentUser = pbClient.authStore.record as BaseModel | null;
            
            if (!currentUser) {
                return {
                    isError: true,
                    message: '用户未登录'
                };
            }

            // 将头像字段设置为 null，PocketBase 会自动删除文件
            const updatedUser = await pbClient.collection('users').update(currentUser.id, {
                avatar: null
            });

            // 更新认证存储中的用户记录
            pbClient.authStore.save(pbClient.authStore.token, updatedUser);

            return updatedUser;
        } catch (e) {
            const error = e as ClientResponseError;

            // 检查是否是 PocketBase 返回的结构化验证错误
            if (error.status === 400 && error.response?.data) {
                return {
                    isError: true,
                    message: '头像删除验证失败。',
                    errors: error.response.data as AvatarError['errors']
                };
            }

            // 捕获其他错误
            return {
                isError: true,
                message: error.message || '头像删除过程中发生未知错误。',
            };
        }
    };

    /**
     * 获取头像完整 URL
     * @param user 用户记录
     * @returns {string} 头像完整 URL
     */
    const getAvatarUrl = (user: BaseModel | null): string => {
        if (!user || !user.avatar) return '';
        
        // 获取原始 URL
        const originalUrl = pbClient.files.getURL(user, user.avatar);
        
        // 获取 collectionId
        const collectionId = user.collectionId;
        
        // 替换 collectionId 为 collectionName
        // 注意：这里直接使用 'users' 作为 collectionName，因为用户集合的名称通常是 'users'
        // 如果需要动态获取，可以使用 pbClient.collections.getOne(collectionId) 异步获取
        const collectionName = 'users';
        
        // 替换 URL 中的 collectionId 为 collectionName
        const modifiedUrl = originalUrl.replace(`/${collectionId}/`, `/${collectionName}/`);
        
        return modifiedUrl;
    };

    // --- 返回属性和方法 ---

    return {
        uploadAvatar,
        deleteAvatar,
        getAvatarUrl
    };
};
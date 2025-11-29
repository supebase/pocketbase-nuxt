import type { ClientResponseError } from "pocketbase";
import type { UserModel, ApiError, ApiResponse } from "~/types/user"; // 导入统一的类型定义

/**
 * 头像管理 Composable
 */
export const useAvatar = () => {
  // 获取 PocketBase 客户端实例
  const { pbClient } = usePocketbase();
  // 获取认证状态
  const { currentUser } = useAuth();
  // 获取错误处理函数
  const { handlePbError } = useErrorHandler();

  // --- 核心功能函数 ---

  /**
   * 上传用户头像
   * @param file 要上传的头像文件
   * @returns {Promise<ApiResponse<UserModel>>} 成功返回更新后的用户记录，失败返回错误对象
   */
  const uploadAvatar = async (file: File): Promise<ApiResponse<UserModel>> => {
    try {
      // 检查用户是否已登录
      if (!currentUser.value) {
        return {
          isError: true,
          message: "用户未登录",
        } as ApiError;
      }

      // 创建表单数据
      const formData = new FormData();
      formData.append("avatar", file);

      // 更新用户记录，PocketBase 会自动处理旧头像的删除
      const updatedUser = await pbClient.collection("users").update<UserModel>(currentUser.value.id, formData);

      // 更新认证存储中的用户记录
      pbClient.authStore.save(pbClient.authStore.token, updatedUser);

      return updatedUser;
    } catch (e) {
      const error = e as ClientResponseError;
      return handlePbError(error, "头像上传验证失败，请检查输入。");
    }
  };

  /**
   * 删除用户头像
   * @returns {Promise<ApiResponse<UserModel>>} 成功返回更新后的用户记录，失败返回错误对象
   */
  const deleteAvatar = async (): Promise<ApiResponse<UserModel>> => {
    try {
      // 检查用户是否已登录
      if (!currentUser.value) {
        return {
          isError: true,
          message: "用户未登录",
        } as ApiError;
      }

      // 将头像字段设置为 null，PocketBase 会自动删除文件
      const updatedUser = await pbClient.collection("users").update<UserModel>(currentUser.value.id, {
        avatar: null,
      });

      // 更新认证存储中的用户记录
      pbClient.authStore.save(pbClient.authStore.token, updatedUser);

      return updatedUser;
    } catch (e) {
      const error = e as ClientResponseError;
      return handlePbError(error, "头像删除验证失败。");
    }
  };

  /**
   * 获取头像完整 URL
   * @param user 用户记录
   * @returns {string} 头像完整 URL
   */
  const getAvatarUrl = (user: UserModel | null): string => {
    if (!user || !user.avatar) return "";

    // 使用 PocketBase 内置方法获取头像 URL
    // 如果 user 对象包含 collectionName，则直接使用，否则使用默认的 'users'
    return pbClient.files.getURL(user, user.avatar);
  };

  // --- 返回属性和方法 ---

  return {
    uploadAvatar,
    deleteAvatar,
    getAvatarUrl,
  };
};

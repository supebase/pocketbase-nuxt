import type { ClientResponseError } from "pocketbase"; // 导入 ClientResponseError 类型用于错误捕获
import type { UserModel, ApiResponse } from "~/types/user"; // 导入统一的类型定义

/**
 * PocketBase 认证 Composable
 */
export const useAuth = () => {
  // 获取 PocketBase 客户端单例
  const { pbClient } = usePocketbase();
  // 获取错误处理函数
  const { handlePbError } = useErrorHandler();
  // 使用 useState 来存储全局响应式的认证用户数据
  const user = useState<UserModel | null>("pocketbase_auth_user", () => null);

  // --- 认证状态初始化和监听 ---

  pbClient.authStore.onChange(() => {
    // 将新的认证模型同步到全局状态
    user.value = pbClient.authStore.record as unknown as UserModel | null;
  }, true); // true 表示立即执行一次监听器

  // --- Computed 属性 ---

  // 检查用户是否已登录
  const isAuthenticated = computed(() => !!user.value);

  // 获取当前用户数据
  const currentUser = computed(() => user.value);

  // --- 核心认证函数 ---

  /**
   * 用户注册 (使用邮箱/密码)
   * @returns {Promise<ApiResponse<UserModel>>} 成功返回用户记录，失败返回错误对象
   */
  const register = async (
    email: string,
    password: string,
    passwordConfirm: string,
    data: object = {}
  ): Promise<ApiResponse<UserModel>> => {
    try {
      // 创建用户
      const newUser = await pbClient.collection("users").create({
        email,
        password,
        passwordConfirm,
        ...data,
      });

      // 注册成功后，自动登录
      // login 可能会返回 ApiError，但在此处通常是成功的
      await login(email, password);

      return newUser as unknown as UserModel;
    } catch (e) {
      const error = e as ClientResponseError;
      return handlePbError(error, "注册验证失败，请检查输入。");
    }
  };

  /**
   * 用户登录 (使用邮箱/密码)
   * @returns {Promise<ApiResponse<void>>} 成功返回 void，失败返回错误对象
   */
  const login = async (email: string, password: string): Promise<ApiResponse<void>> => {
    try {
      // PocketBase 的 authWithPassword 会自动存储 token 和 model
      await pbClient.collection("users").authWithPassword(email, password);
    } catch (e) {
      const error = e as ClientResponseError;
      return handlePbError(error, "登录失败，请检查您的凭证。");
    }
  };

  /**
   * 用户退出
   */
  const logout = () => {
    pbClient.authStore.clear();
  };

  /**
   * 刷新用户的认证 token
   */
  const refreshAuth = async () => {
    if (pbClient.authStore.isValid) {
      await pbClient.collection("users").authRefresh();
    }
  };

  // --- 返回属性和方法 ---

  return {
    isAuthenticated,
    currentUser,
    register,
    login,
    logout,
    refreshAuth,
  };
};

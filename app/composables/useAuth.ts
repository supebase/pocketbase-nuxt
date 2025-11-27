import type { BaseModel } from "pocketbase"; // 导入 PocketBase 的 BaseModel 类型
import type { ClientResponseError } from "pocketbase"; // 导入 ClientResponseError 类型用于错误捕获

// 使用 useState 来存储全局响应式的认证用户数据
const user = useState<BaseModel | null>('pocketbase_auth_user', () => null);

// 定义通用的认证错误信息的结构
interface AuthError {
    isError: true;
    message: string; // 用于顶层的通用错误提示 (如 "登录失败" 或 "注册验证失败")
    // errors 结构为 { fieldName: { code: string, message: string } }
    errors?: Record<string, { code: string; message: string }>;
}

/**
 * PocketBase 认证 Composable
 */
export const useAuth = () => {
    // 假设 usePocketbase 是一个自定义 hook，用于获取 pbClient 实例
    // 实际项目中需要确保它能被访问到
    // @ts-ignore
    const { pbClient } = usePocketbase(); // 获取 PocketBase 客户端单例

    // --- 认证状态初始化和监听 ---

    pbClient.authStore.onChange(() => {
        // 将新的认证模型同步到全局状态
        user.value = pbClient.authStore.record as BaseModel | null;
    }, true); // true 表示立即执行一次监听器

    // --- Computed 属性 ---

    // 检查用户是否已登录
    const isAuthenticated = computed(() => !!user.value);

    // 获取当前用户数据
    const currentUser = computed(() => user.value);

    // --- 核心认证函数 ---

    /**
     * 用户注册 (使用邮箱/密码)
     * @returns {Promise<BaseModel | AuthError>} 成功返回用户记录，失败返回错误对象
     */
    const register = async (email: string, password: string, passwordConfirm: string, data: object = {}): Promise<BaseModel | AuthError> => {
        try {
            // 创建用户
            const newUser = await pbClient.collection('users').create({
                email,
                password,
                passwordConfirm,
                ...data
            });

            // 注册成功后，自动登录
            // login 可能会返回 AuthError，但在此处通常是成功的
            await login(email, password);

            return newUser;
        } catch (e) {
            const error = e as ClientResponseError;

            // 检查是否是 PocketBase 返回的结构化验证错误 (400 Bad Request)
            if (error.status === 400 && error.response?.data) {
                // 返回一个包含字段级错误信息的对象
                return {
                    isError: true,
                    message: '注册验证失败，请检查输入。',
                    errors: error.response.data as AuthError['errors']
                };
            }

            // 捕获非预期的 PocketBase 错误（如 500 服务器错误或网络问题）
            return {
                isError: true,
                message: error.message || '注册过程中发生未知错误。',
            };
        }
    };

    /**
     * 用户登录 (使用邮箱/密码)
     * @returns {Promise<void | AuthError>} 成功返回 void，失败返回错误对象
     */
    const login = async (email: string, password: string): Promise<void | AuthError> => {
        try {
            // PocketBase 的 authWithPassword 会自动存储 token 和 model
            await pbClient.collection('users').authWithPassword(email, password);
            console.log("用户登录成功:", pbClient.authStore.record);
        } catch (e) {
            const error = e as ClientResponseError;

            // 检查是否是登录凭证错误 (通常是 400 Bad Request)
            if (error.status === 400) {
                // 明确使用我们自定义的友好提示，覆盖 PocketBase 的默认消息
                return {
                    isError: true,
                    // 🌟 核心修改点：强制使用自定义消息
                    message: '登录失败，请检查您的凭证。'
                };
            }

            // 捕获其他非 400 的 PocketBase 错误（如网络中断，500 服务器错误等）
            return {
                isError: true,
                message: error.message || '登录过程中发生未知错误。'
            };
        }
    };

    /**
     * 用户退出
     */
    const logout = () => {
        pbClient.authStore.clear();
        console.log("用户退出成功");
    };

    /**
     * 刷新用户的认证 token
     */
    const refreshAuth = async () => {
        if (pbClient.authStore.isValid) {
            await pbClient.collection('users').authRefresh();
            console.log("Token 已刷新");
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
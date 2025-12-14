export default defineEventHandler(async (event) => {
    try {
        // 1. 清除 nuxt-auth-utils 创建的用户会话 Cookie
        await clearUserSession(event);

        // 2. 可选：清除 PocketBase 客户端的 authStore，
        // 虽然不是必须的，因为新的请求会创建新的 pb 实例。
        // 如果您在服务端使用了持久化的 PocketBase 实例，则这一步很重要。
        // const { pb } = usePocketbaseClient(); // 假设有
        // pb.authStore.clear();

        return { message: 'Logout successful' };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Logout failed',
        });
    }
});
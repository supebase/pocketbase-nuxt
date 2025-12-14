import 'nuxt-auth-utils';
import type { PocketbaseUser } from '../../server/utils/pocketbase'; // 根据您的路径调整

declare module '#auth-utils' {
    interface User extends PocketbaseUser {
        // 扩展或覆盖 User 类型
    }

    interface UserSession {
        user: User;
        // 可以添加 PocketBase 的 token 等信息，但为了安全和遵循 nuxt-auth-utils 最佳实践，
        // 建议只存储在前端显示所需的**非敏感**信息。
    }
}

export { };
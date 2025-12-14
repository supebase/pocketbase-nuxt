import { navigateTo } from 'nuxt/app';
import { pb } from '../../utils/pocketbase';

export default defineEventHandler(async (event) => {
    const { email, password } = await readBody(event);

    if (!email || !password) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing login credentials',
        });
    }

    try {
        // 1. 使用 PocketBase 认证
        const authData = await pb.collection('users').authWithPassword(email, password);
        const pbUser = authData.record;

        // 2. 设置用户会话
        await setUserSession(event, {
            user: {
                id: pbUser.id,
                email: pbUser.email,
                avatar: pbUser.avatar,
                // ... 其他您定义的字段
            },
            // 可以在此处存储 PocketBase auth token，以便后续在服务端 API 中使用（例如访问受限数据）
            // **警告：** 由于 cookie 大小限制，仅存储必要的 token，且确保其安全地在服务端使用。
            // 对于简单的状态管理，仅存储 user 对象即可。
        });

        return {
            message: 'Login successful',
            user: { id: pbUser.id, email: pbUser.email, avatar: pbUser.avatar }
        };
    } catch (error: any) {
        console.error('PocketBase Login Error:', error.message);
        // PocketBase 认证失败通常返回 400 错误
        throw createError({
            statusCode: 401, // 使用 401 表示未授权/凭证无效
            statusMessage: 'Invalid credentials',
        });
    }
});
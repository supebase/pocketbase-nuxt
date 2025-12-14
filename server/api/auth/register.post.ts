import { pb, getMd5Hash } from '../../utils/pocketbase';

export default defineEventHandler(async (event) => {
    const { email, password, passwordConfirm } = await readBody(event);

    if (!email || !password || !passwordConfirm) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing registration fields',
        });
    }

    const md5Hash = getMd5Hash(email)

    try {
        // 1. 在 PocketBase 中创建用户记录
        await pb.collection('users').create({
            email,
            password,
            passwordConfirm,
            avatar: md5Hash,
        });

        // 2. 注册成功后，立即尝试登录（可选步骤，但用户体验更好）
        const authData = await pb.collection('users').authWithPassword(email, password);
        const pbUser = authData.record;

        // 3. 设置用户会话（这会设置加密的 Cookie）
        // 仅存储用户在前端需要显示的基本、非敏感信息。
        await setUserSession(event, {
            user: {
                id: pbUser.id,
                email: pbUser.email,
                avatar: pbUser.avatar,
                // ... 其他您定义的字段
            },
        });

        return {
            message: 'Registration successful',
            user: { id: pbUser.id, email: pbUser.email, avatar: pbUser.avatar }
        };
    } catch (error: any) {
        console.error('PocketBase Registration Error:', error.message);
        throw createError({
            statusCode: 400,
            statusMessage: error.message || 'Registration failed',
        });
    }
});
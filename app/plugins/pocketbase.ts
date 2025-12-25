import PocketBase from 'pocketbase';
import type { TypedPocketBase } from '~/types/pocketbase-types';

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig();

    // 使用公共配置中的 Websocket/API URL
    const pb = new PocketBase(config.public.pocketbaseWebsocket as string) as TypedPocketBase;

    // 仅在客户端同步 AuthStore
    if (import.meta.client) {
        // 1. 从 Cookie 加载状态 (由 server/utils/authHelpers.ts 写入)
        // pb.authStore.loadFromCookie(document.cookie);

        // // 2. 监听状态改变
        // // 当用户在客户端调用 pb.authWithPassword 或注销时，同步更新 Cookie
        // pb.authStore.onChange(() => {
        //     document.cookie = pb.authStore.exportToCookie({
        //         httpOnly: false,
        //         secure: true,
        //         sameSite: 'Lax',
        //         path: '/'
        //     });
        // }, true);

        // 1. 精准加载：只加载名为 pb_auth 的 cookie
        const authCookie = useCookie('pb_auth').value;
        if (authCookie) {
            // 注意：这里需要拼接成 key=value 格式
            pb.authStore.loadFromCookie(`pb_auth=${authCookie}`);
        }

        // 2. 只有当确实有有效数据时，或者明确执行了 logout 时，才更新 Cookie
        pb.authStore.onChange((token, model) => {
            // 如果 token 为空且当前没有存储的有效状态，不自动重写 cookie，除非是手动登出
            document.cookie = pb.authStore.exportToCookie({
                httpOnly: false,
                secure: true,
                sameSite: 'Lax',
                path: '/',
                maxAge: token ? 60 * 60 * 24 * 7 : -1 // 如果没 token，设置立即过期
            });
        }, false); // 💡 将 true 改为 false，避免初始化时立即触发覆盖
    }

    return {
        provide: {
            pb
        }
    };
});
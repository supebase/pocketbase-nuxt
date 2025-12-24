import PocketBase from 'pocketbase';
import type { TypedPocketBase } from '~/types/pocketbase-types';

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig();

    // 使用公共配置中的 Websocket/API URL
    const pb = new PocketBase(config.public.pocketbaseWebsocket as string) as TypedPocketBase;

    // 仅在客户端同步 AuthStore
    if (import.meta.client) {
        // 1. 从 Cookie 加载状态 (由 server/utils/authHelpers.ts 写入)
        pb.authStore.loadFromCookie(document.cookie);

        // 2. 监听状态改变
        // 当用户在客户端调用 pb.authWithPassword 或注销时，同步更新 Cookie
        pb.authStore.onChange(() => {
            document.cookie = pb.authStore.exportToCookie({
                httpOnly: false,
                secure: true,
                sameSite: 'Lax',
                path: '/'
            });
        }, true);
    }

    return {
        provide: {
            pb
        }
    };
});
import PocketBase from 'pocketbase';
// 导入你生成的强类型定义
import type { TypedPocketBase } from '~/types/pocketbase-types';

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig();

    // 1. 创建强类型单例
    // 即使主要用于 Realtime，强类型也能让你在订阅回调时获得字段补全
    const pb = new PocketBase(config.public.pocketbaseWsUrl as string) as TypedPocketBase;

    // 2. 仅在客户端同步 AuthStore
    if (import.meta.client) {
        // 从 Cookie 加载状态
        pb.authStore.loadFromCookie(document.cookie);

        // 监听状态改变
        pb.authStore.onChange(() => {
            // 导出到 Cookie，设置 samesite 提高兼容性
            document.cookie = pb.authStore.exportToCookie({
                httpOnly: false,
                secure: true,
                sameSite: 'Lax'
            });
        });
    }

    return {
        provide: {
            // 提供给全局使用的 $pb
            pb
        }
    };
});
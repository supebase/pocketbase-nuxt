import PocketBase from 'pocketbase';

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig();

    // 创建单例
    const pb = new PocketBase(config.public.pocketbaseWsUrl as string);

    // 如果你有身份验证需求，可以在客户端初始化时从 cookie 同步状态
    if (import.meta.client) {
        pb.authStore.loadFromCookie(document.cookie);
        pb.authStore.onChange(() => {
            document.cookie = pb.authStore.exportToCookie({ httpOnly: false });
        });
    }

    return {
        provide: {
            pb: pb as PocketBase
        }
    };
});
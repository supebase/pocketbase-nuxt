export const usePocketbase = () => {
    // 使用 useNuxtApp() 获取当前 Nuxt 实例
    const nuxtApp = useNuxtApp();

    // 从插件注入中获取 $pbClient 实例
    const pbClient = nuxtApp.$pbClient;

    return {
        pbClient,
    };
};
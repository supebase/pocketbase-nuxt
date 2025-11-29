export const usePocketbase = () => {
    // 使用 useNuxtApp() 获取当前 Nuxt 实例
    const nuxtApp = useNuxtApp();

    // 从插件注入中获取 $pbClient 实例
    const pbClient = nuxtApp.$pbClient;

    return {
        pbClient,
        // 提供 Auth Store 的便捷访问
        authStore: pbClient.authStore,
        // 提供常用的 Auth Store 方法
        isAuthenticated: computed(() => !!pbClient.authStore.record),
        isValidToken: computed(() => pbClient.authStore.isValid),
    };
};
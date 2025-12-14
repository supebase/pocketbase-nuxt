export default defineNuxtRouteMiddleware((to, from) => {
    const { loggedIn } = useUserSession();

    // 如果已登录，访问认证页，则重定向到首页
    if (loggedIn.value && to.path === '/auth') {
        return navigateTo('/', { replace: true });
    }

    // 如果未登录，访问受保护页，则重定向到认证页
    if (!loggedIn.value && to.path !== '/auth') {
        return navigateTo('/auth', { replace: true });
    }
});
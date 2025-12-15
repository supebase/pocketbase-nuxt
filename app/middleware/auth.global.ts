export default defineNuxtRouteMiddleware((to, from) => {
  const { loggedIn, user } = useUserSession();

  // 如果已登录，访问认证页，则重定向到首页
  if (loggedIn.value && to.path === "/auth") {
    return navigateTo("/", { replace: true });
  }

  // 当用户访问发表文章页面时，需要检查用户是否已登录且verified为true
  if (to.path.includes("/new")) {
    // 未登录则重定向到登录页
    if (!loggedIn.value) {
      return navigateTo("/auth", { replace: true });
    }

    // 已登录但未验证则提示用户
    if (loggedIn.value && !user.value?.verified) {
      // 可以根据需要修改为更友好的提示方式
      return navigateTo("/", { replace: true });
    }
  }

  // 所有其他页面均可无登录访问
});

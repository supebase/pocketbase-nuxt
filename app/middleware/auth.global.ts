/**
 * @file Auth Global Middleware
 * @description 统一处理路由鉴权逻辑：1.禁止已登录访问认证页 2.保护敏感路径 3.强制邮箱验证(可选)
 */
export default defineNuxtRouteMiddleware((to, from) => {
  const { loggedIn, user } = useUserSession();

  // 1. 如果已登录，访问认证页（/auth），则重定向到首页
  if (loggedIn.value && to.path === '/auth') {
    return navigateTo('/', { replace: true });
  }

  /**
   * 2. 定义受保护路由（必须登录后访问）
   * ^/new$ : 精确匹配发布页
   * ^/edit/.* : 匹配编辑页及其子路径
   * ^/notifications$ : 精确匹配通知中心
   */
  const protectedRoutes = [/^\/new$/, /^\/edit\/.*/, /^\/notifications$/];
  const isProtectedRoute = protectedRoutes.some((re) => re.test(to.path));

  if (isProtectedRoute) {
    // 未登录：重定向到登录页，并带上 redirect 参数以便登录后跳回
    if (!loggedIn.value) {
      return navigateTo(
        {
          path: '/auth',
          query: { redirect: to.fullPath },
        },
        { replace: true },
      );
    }

    /**
     * 3. 管理员验证 (Admin) 校验逻辑
     * 策略：发布和编辑（写操作）强制要求验证；查看通知（读操作）放行
     */
    const isWriteOperation = /^\/new$/.test(to.path) || /^\/edit\/.*/.test(to.path);

    if (isWriteOperation && user.value && !user.value.is_admin) {
      // 如果用户已登录但未验证邮箱，禁止发布/编辑，回退到首页
      // 建议：此处可以配合全局 toast 提示用户“请先验证邮箱”
      return navigateTo('/', { replace: true });
    }
  }

  // 其他公开页面（首页、文章详情等）直接放行
});

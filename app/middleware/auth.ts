export default defineNuxtRouteMiddleware(() => {
  // 获取认证状态
  const { currentUser } = useAuth();
  
  // 检查用户是否已登录
  if (!currentUser.value) {
    // 未登录用户重定向到首页
    return navigateTo('/');
  }
});

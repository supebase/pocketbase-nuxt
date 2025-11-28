export default defineNuxtRouteMiddleware(() => {
  // 获取认证状态
  const { currentUser } = useAuth();
  
  // 检查用户是否已登录且已验证
  if (!currentUser.value || !currentUser.value.verified) {
    // 未验证用户重定向到文章列表页
    return navigateTo('/posts');
  }
});

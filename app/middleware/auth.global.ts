export default defineNuxtRouteMiddleware((to, from) => {
	const { loggedIn, user } = useUserSession();

	// 1. 如果已登录，访问认证页，则重定向到首页
	if (loggedIn.value && to.path === '/auth') {
		return navigateTo('/', { replace: true });
	}

	// 2. 检查是否为发布或编辑页面
	// 使用正则表达式：
	// ^/new$ 匹配精确的 /new 路径
	// ^/edit/.* 匹配以 /edit/ 开头的所有路径
	const isWritePage = /^\/new$/.test(to.path) || /^\/edit\/.*/.test(to.path);

	if (isWritePage) {
		// 未登录：重定向到登录页，并带上回跳参数
		if (!loggedIn.value) {
			return navigateTo({
				path: '/auth',
				query: { redirect: to.fullPath }
			}, { replace: true });
		}

		// 已登录但未验证：PocketBase 身份保护
		// 如果你要求只有 verified 用户能发布，保留此逻辑
		if (user.value && !user.value.verified) {
			// 这里可以跳转到首页，并配合一个全局提示
			return navigateTo('/', { replace: true });
		}
	}

	// 其他页面放行
});
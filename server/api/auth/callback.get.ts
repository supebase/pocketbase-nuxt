export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const code = query.code as string;
  const state = query.state as string; // 获取 URL 中的 state

  // 获取 Cookie 中保存的验证数据
  const codeVerifier = getCookie(event, 'pb_github_verifier');
  const savedState = getCookie(event, 'pb_github_state');

  const origin = getRequestURL(event).origin;
  const redirectUrl = `${origin}/api/auth/callback`;

  // 核心安全验证：增加 state 匹配逻辑
  if (!code || !codeVerifier || !state || state !== savedState) {
    // 验证失败，清除可能有问题的 Cookie 并重定向
    deleteCookie(event, 'pb_github_verifier');
    deleteCookie(event, 'pb_github_state');
    return sendRedirect(event, '/auth?error=invalid_state_or_session');
  }

  const pb = getPocketBase(event);

  try {
    const geo = await $fetch<{ location: string }>('/api/ip', {
      headers: getRequestHeaders(event) as Record<string, string>,
    }).catch(() => null); // 兜底防止地理位置接口挂掉导致登录失败

    // 交换授权码
    await pb.collection('users').authWithOAuth2Code('github', code, codeVerifier, redirectUrl, {
      location: geo?.location,
    });

    await handleAuthSuccess(event, pb, '登录成功');

    // 登录成功，清理所有 OAuth 相关 Cookie
    deleteCookie(event, 'pb_github_verifier');
    deleteCookie(event, 'pb_github_state');

    return sendRedirect(event, '/');
  } catch (err: any) {
    deleteCookie(event, 'pb_github_verifier');

    return sendRedirect(event, '/auth?error=auth_failed');
  }
});

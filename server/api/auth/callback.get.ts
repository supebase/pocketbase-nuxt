export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const code = query.code as string;
  const state = query.state as string;

  const codeVerifier = getCookie(event, 'pb_github_verifier');
  const savedState = getCookie(event, 'pb_github_state');

  // 定义统一清理 OAuth 临时状态的函数
  const clearOAuthState = () => {
    deleteCookie(event, 'pb_github_verifier');
    deleteCookie(event, 'pb_github_state');
  };

  const origin = getRequestURL(event).origin;
  const redirectUrl = `${origin}/api/auth/callback`;

  // 1. 核心安全验证：增加 state 匹配逻辑
  // 修正风险：确保所有必要参数存在且匹配
  if (!code || !codeVerifier || !state || state !== savedState) {
    clearOAuthState();
    // 风险预防：如果 state 校验失败，可能存在 CSRF 或恶意重放
    // 此时清理已有的 pb_auth 和 Session 确保安全
    deleteCookie(event, 'pb_auth');
    await clearUserSession(event);

    return sendRedirect(event, '/auth?error=invalid_state_or_session');
  }

  const pb = getPocketBase(event);

  try {
    const geo = await $fetch<{ location: string }>('/api/ip', {
      headers: getRequestHeaders(event) as Record<string, string>,
    }).catch(() => null);

    // 2. 交换授权码
    await pb.collection('users').authWithOAuth2Code('github', code, codeVerifier, redirectUrl, {
      location: geo?.location,
    });

    // 3. 执行成功后的 Session 写入和 HttpOnly Cookie 设置
    await handleAuthSuccess(event, pb, '登录成功');

    // 4. 成功后清理
    clearOAuthState();

    return sendRedirect(event, '/');
  } catch (err: any) {
    // 修正风险：异常路径下的清理不一致问题
    // 无论发生什么错误，都必须同时清理 verifier 和 state
    clearOAuthState();

    console.error('[OAuth Callback Error]:', err?.message);
    return sendRedirect(event, '/auth?error=auth_failed');
  }
});

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const code = query.code as string;
  const codeVerifier = getCookie(event, 'pb_github_verifier');

  const origin = getRequestURL(event).origin;
  const redirectUrl = `${origin}/api/auth/callback`;

  if (!code || !codeVerifier) {
    return sendRedirect(event, '/auth?error=missing_code_or_verifier');
  }

  const pb = getPocketBase(event);

  try {
    const geo = await $fetch<{ location: string }>('/api/ip', {
      headers: getRequestHeaders(event) as Record<string, string>,
    });
    // 交换授权码。如果用户是第一次登录，PocketBase 会自动创建账号
    await pb.collection('users').authWithOAuth2Code('github', code, codeVerifier, redirectUrl, {
      location: geo?.location,
    });

    // 调用你现有的 handleAuthSuccess 写入 Cookie 和 Session
    await handleAuthSuccess(event, pb, '登录成功');

    deleteCookie(event, 'pb_github_verifier');
    return sendRedirect(event, '/');
  } catch (err: any) {
    console.error('GitHub Callback Error:', err);
    return sendRedirect(event, '/auth?error=auth_failed');
  }
});

export default defineEventHandler(async (event) => {
  const pb = getPocketBase(event);
  const origin = getRequestURL(event).origin;
  const redirectUrl = `${origin}/api/auth/callback`;

  try {
    // 获取认证方法
    const authMethods = await pb.collection('users').listAuthMethods();
    const github = authMethods.oauth2.providers.find((p: any) => p.name === 'github');

    if (!github) {
      throw createError({ status: 500, message: 'PocketBase OAuth2 未启用或 GitHub 未配置' });
    }

    // 存储 codeVerifier 供回调使用
    setCookie(event, 'pb_github_verifier', github.codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
    });

    // 构建完整的授权地址
    const fullAuthUrl = `${github.authURL}${encodeURIComponent(redirectUrl)}`;

    return sendRedirect(event, fullAuthUrl);
  } catch (err) {
    throw createError({ status: 500, message: '无法获取 GitHub 授权配置' });
  }
});

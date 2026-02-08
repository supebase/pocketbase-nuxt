import { randomUUID } from 'node:crypto';

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

    const state = randomUUID();

    const cookieConfig = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 600,
      path: '/',
    };

    setCookie(event, 'pb_github_verifier', github.codeVerifier, cookieConfig);
    setCookie(event, 'pb_github_state', state, cookieConfig);

    const fullUrlString = github.authURL + encodeURIComponent(redirectUrl);

    // 使用 URL 对象来安全地追加 state
    const authUrl = new URL(fullUrlString);
    authUrl.searchParams.set('state', state);

    return sendRedirect(event, authUrl.toString());
  } catch (err) {
    throw createError({ status: 500, message: '无法获取 GitHub 授权配置' });
  }
});

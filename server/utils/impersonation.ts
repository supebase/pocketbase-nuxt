import PocketBase from 'pocketbase';

export const getImpersonation = async () => {
  // 获取配置
  const backendUrl = process.env.NUXT_POCKETBASE_URL;
  const adminEmail = process.env.NUXT_PB_ADMIN_EMAIL;
  const adminPassword = process.env.NUXT_PB_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error('未配置 NUXT_PB_ADMIN_EMAIL 或 NUXT_PB_ADMIN_PASSWORD');
  }

  const pb = new PocketBase(backendUrl);

  // 直接以 Admin 身份登录
  // Admin 登录后，后续的 pb.collection('posts').getFullList() 将无视任何权限限制
  await pb.collection('_superusers').authWithPassword(adminEmail, adminPassword);

  return pb;
};

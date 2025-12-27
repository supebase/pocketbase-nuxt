import PocketBase from 'pocketbase';
import type { TypedPocketBase } from '~/types/pocketbase-types';

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const pb = new PocketBase(config.public.pocketbaseWebsocket) as TypedPocketBase;

  if (import.meta.client) {
    // 1. 初始化：从 Cookie 加载状态
    const authCookie = useCookie('pb_auth').value;
    if (authCookie) {
      pb.authStore.loadFromCookie(`pb_auth=${authCookie}`);
    }

    // 2. 多标签页同步逻辑
    const syncChannel = new BroadcastChannel('pb_auth_sync');

    pb.authStore.onChange((token, model) => {
      // 更新本地 Cookie
      document.cookie = pb.authStore.exportToCookie({
        httpOnly: false,
        secure: true,
        sameSite: 'Lax',
        path: '/',
        maxAge: token ? 60 * 60 * 24 * 7 : -1,
      });

      // 通知其他标签页同步状态
      syncChannel.postMessage({ token, model });
    }, false);

    // 监听来自其他标签页的同步消息
    syncChannel.onmessage = (event) => {
      const { token, model } = event.data;
      pb.authStore.save(token, model);
    };
  }

  return { provide: { pb } };
});

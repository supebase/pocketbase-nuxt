import PocketBase from 'pocketbase';
import type { TypedPocketBase } from '~/types/pocketbase-types';

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const pb = new PocketBase(config.public.pocketbaseWebsocket) as TypedPocketBase;

  // 1. 客户端初始化逻辑
  if (import.meta.client) {
    const { session } = useUserSession();
    // 从 Cookie 恢复初始状态
    // 💡 提示：'pb_auth' 需与后端 authHelpers 中的保持一致
    if (session.value?.secure?.pbToken) {
      pb.authStore.save(session.value.secure.pbToken, session.value.user as any);
    } else {
      pb.authStore.loadFromCookie(document.cookie, 'pb_auth');
    }

    // 2. 多标签页同步通道
    const syncChannel = new BroadcastChannel('pb_auth_sync');

    pb.authStore.onChange((token, model) => {
      // 💡 更新 Cookie (与后端保持同步)
      const cookieString = pb.authStore.exportToCookie({
        httpOnly: false, // 客户端必须为 false 才能读取
        secure: true,
        sameSite: 'Lax',
        path: '/',
        maxAge: token ? 60 * 60 * 24 * 7 : -1,
      });
      document.cookie = cookieString;

      // 💡 状态清理增强：登出时主动断开 Websocket
      if (!token) {
        pb.cancelAllRequests(); // 取消所有进行中的请求
      }

      // 通知其他标签页
      syncChannel.postMessage({ token, model });
    }, false);

    // 监听其他标签页同步
    syncChannel.onmessage = (event) => {
      const { token, model } = event.data;
      if (token) {
        pb.authStore.save(token, model);
      } else {
        pb.authStore.clear();
      }
    };
  }

  return { provide: { pb } };
});

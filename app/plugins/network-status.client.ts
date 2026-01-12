// app/plugins/network-status.client.ts
import { useNetwork } from '@vueuse/core';

export default defineNuxtPlugin(() => {
  if (!import.meta.client) return;

  const toast = useToast();
  const { isOnline } = useNetwork();

  /**
   * 统一处理网络状态变化的 UI 反馈
   * @param online 当前是否在线
   * @param showToast 是否显示通知（用于初始状态时静默处理）
   */
  const updateNetworkUI = (online: boolean, showToast: boolean) => {
    if (online) {
      document.documentElement.style.filter = 'none';
      if (showToast) {
        toast.add({
          title: '在线状态',
          description: '网络已恢复，可以正常访问',
          color: 'success',
        });
      }
    } else {
      document.documentElement.style.filter = 'grayscale(1)';
      if (showToast) {
        toast.add({
          title: '离线状态',
          description: '网络已断开，请检查网络连接',
          color: 'warning',
        });
      }
    }
  };

  // 在 Nuxt Ready 后开始逻辑，确保 Toast 等组件已可用
  onNuxtReady(() => {
    // 1. 初始状态同步：如果是离线，置灰页面，但不弹出 Toast 骚扰用户
    if (!isOnline.value) {
      updateNetworkUI(false, false);
    }

    // 2. 持续监听网络变化
    watch(isOnline, (online) => {
      updateNetworkUI(online, true);
    });
  });

  return {
    provide: {
      // 暴露给全局，可以通过 useNuxtApp().$isOnline 访问
      isOnline,
    },
  };
});

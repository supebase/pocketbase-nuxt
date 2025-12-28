import { useNetwork } from '@vueuse/core';

export default defineNuxtPlugin(() => {
  const toast = useToast();

  if (import.meta.client) {
    const { isOnline } = useNetwork();

    // 1. 使用 onNuxtReady 确保在 Hydration 完成后执行
    onNuxtReady(() => {
      watch(
        isOnline,
        (online) => {
          // 2. 只有当状态发生明确变化，或者你确实想在进入时检查
          if (!online) {
            toast.add({
              title: '离线状态',
              description: '网络已断开，请检查网络连接',
              color: 'warning',
            });
            document.documentElement.style.filter = 'grayscale(1)';
          } else {
            // 如果不想一进页面就弹“已连接”，可以根据逻辑判断
            toast.add({
              title: '在线状态',
              description: "网络已恢复，可以正常访问",
              color: 'success',
            });
            document.documentElement.style.filter = 'none';
          }
        },
        // 3. 既然用了 onNuxtReady，immediate: true 也不再会导致 Hydration 错误
        { immediate: false }
      );
    });

    return {
      provide: {
        isOnline,
      },
    };
  }
});

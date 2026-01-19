export default defineNuxtPlugin(() => {
  // 定义一个全局响应式的布尔值状态
  const isWechat = useState<boolean>('isWechat', () => false);

  // 仅在客户端执行检测
  if (import.meta.client) {
    const checkWechat = (): void => {
      const ua: string = window.navigator.userAgent.toLowerCase();
      const isWx: boolean = /micromessenger/i.test(ua);
      isWechat.value = isWx;
    };

    checkWechat();
  }

  return {
    provide: {
      // 这里的 $isWechat 可以在组件中通过 useNuxtApp().$isWechat 访问
      isWechat: isWechat,
    },
  };
});

export default defineNuxtPlugin(() => {
  // .client.ts 后缀已确保仅在客户端运行，但 import.meta.client 是双重保险
  if (!import.meta.client) return;

  // 1. 禁止双指缩放
  const handleTouchStart = (event: TouchEvent) => {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  };

  // 2. 禁止双击缩放 (300ms 阈值)
  let lastTouchEnd = 0;
  const handleTouchEnd = (event: TouchEvent) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  };

  // 3. 禁止手势缩放 (针对 Safari)
  const handleGestureStart = (event: Event) => {
    event.preventDefault();
  };

  // 注册全局监听
  // 注意：{ passive: false } 极其重要，否则浏览器为了滚动性能会忽略 preventDefault
  document.addEventListener('touchstart', handleTouchStart, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, false);
  document.addEventListener('gesturestart', handleGestureStart);
});

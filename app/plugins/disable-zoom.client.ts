export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    // 1. 禁止双指缩放
    document.addEventListener(
      'touchstart',
      (event) => {
        if (event.touches.length > 1) {
          event.preventDefault();
        }
      },
      { passive: false },
    );

    // 2. 禁止双击缩放
    let lastTouchEnd = 0;
    document.addEventListener(
      'touchend',
      (event) => {
        const now = new Date().getTime();
        if (now - lastTouchEnd <= 300) {
          event.preventDefault();
        }
        lastTouchEnd = now;
      },
      false,
    );

    // 3. 禁止手势缩放 (针对 Safari)
    document.addEventListener('gesturestart', (event) => {
      event.preventDefault();
    });
  }
});

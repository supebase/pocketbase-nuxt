/**
 * 时间轴滚动进度计算逻辑
 * (纯计算函数，不涉及内存泄漏)
 */
export function calculateTimelineProgress(params: {
  height: number;
  top: number;
  windowY: number;
  triggerRatio: number;
}) {
  const { height, top, windowY, triggerRatio } = params;
  if (height <= 100) return 0;

  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
  const triggerPoint = viewportHeight * triggerRatio;

  const elementTopRelativeDoc = top + windowY;
  const currentProgress = windowY + triggerPoint - (elementTopRelativeDoc + 40);
  const adjustableHeight = height - 80;

  if (adjustableHeight <= 0) return 0;
  return Math.min(Math.max((currentProgress / adjustableHeight) * 100, 0), 100);
}

/**
 * 列表交错动画逻辑
 * 修复：返回 Animation 实例以便外部管理
 */
export function playStaggerAnimation(
  el: HTMLElement,
  index: number,
  options: {
    delay: number;
    yOffset: number;
  },
) {
  return el.animate(
    [
      { opacity: 0, transform: `translateY(${options.yOffset}px)` },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    {
      duration: 600,
      delay: options.delay * 1000,
      fill: 'forwards',
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  );
}

/**
 * 冷却计时器逻辑
 * 修复点：
 * 1. 使用 onUnmounted 自动清理定时器
 * 2. 优化 timer 类型定义
 * 3. 封装 stopTimer 保证逻辑复用
 */
export function useCooldown(initialSeconds: number = 30) {
  const remainingSeconds = ref(0);
  let timer: ReturnType<typeof setInterval> | null = null;

  const isCoolingDown = computed(() => remainingSeconds.value > 0);

  const stopTimer = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const startCooldown = () => {
    remainingSeconds.value = initialSeconds;
    // 启动新计时器前，确保旧的已被清理
    stopTimer();

    timer = setInterval(() => {
      // 使用更精确的步进，减少浮点数运算误差
      const nextValue = Math.round((remainingSeconds.value - 0.1) * 10) / 10;
      remainingSeconds.value = Math.max(0, nextValue);

      if (remainingSeconds.value <= 0) {
        stopTimer();
      }
    }, 100);
  };

  // 关键：组件卸载时强制回收资源
  onUnmounted(() => {
    stopTimer();
  });

  return { remainingSeconds, isCoolingDown, startCooldown, stopTimer };
}

/**
 * 启动圆形扩散的主题切换动画
 * 修复：增加对异步回调的安全处理
 */
export function startThemeTransition(event: MouseEvent, callback: () => void) {
  if (!document.startViewTransition) {
    callback();
    return;
  }

  const x = event.clientX;
  const y = event.clientY;
  const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  const transition = document.startViewTransition(async () => {
    callback();
  });

  transition.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`],
        },
        {
          duration: 500,
          easing: 'cubic-bezier(.76,.32,.29,.99)',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    })
    .catch((err: any) => {
      console.error('View Transition failed:', err);
    });
}

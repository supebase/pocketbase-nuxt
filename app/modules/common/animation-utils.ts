/**
 * 时间轴滚动进度计算逻辑
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
 */
export function useCooldown(initialSeconds: number = 30) {
  const remainingSeconds = ref(0);
  let timer: any = null;

  const isCoolingDown = computed(() => remainingSeconds.value > 0);

  const startCooldown = () => {
    remainingSeconds.value = initialSeconds;
    if (timer) clearInterval(timer);

    // 恢复到 100ms 更新一次，这能给组件留出足够的 CSS 过渡时间
    timer = setInterval(() => {
      remainingSeconds.value = Math.max(0, remainingSeconds.value - 0.1);
      if (remainingSeconds.value <= 0) {
        remainingSeconds.value = 0;
        clearInterval(timer);
      }
    }, 100);
  };

  return { remainingSeconds, isCoolingDown, startCooldown };
}

/**
 * 启动圆形扩散的主题切换动画
 */
export function startThemeTransition(event: MouseEvent, callback: () => void) {
  // @ts-ignore - 部分浏览器不支持 startViewTransition
  if (!document.startViewTransition) {
    callback();
    return;
  }

  const x = event.clientX;
  const y = event.clientY;
  const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  // @ts-ignore
  const transition = document.startViewTransition(() => {
    callback();
  });

  transition.ready.then(() => {
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
  });
}

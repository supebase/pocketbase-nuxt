<template>
  <div ref="timelineContainer" class="relative">
    <div
      class="absolute top-8 bottom-8 w-0.5 z-0 bg-neutral-100 dark:bg-neutral-800 overflow-hidden mask-b-from-85%"
      :style="{ left: lineOffset }"
    >
      <div
        class="absolute top-0 w-full bg-primary rounded-full will-change-[height]"
        :class="{
          'transition-[height] duration-500 ease-out': !isLocked && !loadingMore && !isResetting,
          'transition-none': isLocked || loadingMore || isResetting,
        }"
        :style="{ height: `${progress}%` }"
      />
    </div>

    <TransitionGroup tag="div" :css="false" @before-enter="onBeforeEnter" @enter="onEnter" class="relative z-10">
      <div v-for="(item, index) in itemsWithIndex" :key="item.id || index" class="timeline-item-wrapper">
        <UTimeline :items="[item]" :ui="mergedUi" v-bind="$attrs">
          <template v-for="(_, name) in $slots" #[name]="slotData">
            <slot :name="name" v-bind="slotData" :index="index" />
          </template>
        </UTimeline>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useElementBounding, useWindowScroll } from '@vueuse/core';

interface Props {
  items: any[];
  loadingMore?: boolean;
  isResetting?: boolean;
  ui?: Record<string, any>;
  lineOffset?: string;
  triggerRatio?: number;
  stagger?: number;
  yOffset?: number;
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  loadingMore: false,
  isResetting: false,
  ui: () => ({}),
  lineOffset: '15px',
  triggerRatio: 0.5,
  stagger: 0.06,
  yOffset: 20,
});

const mergedUi = computed(() => ({
  wrapper: 'w-full overflow-hidden',
  title: '-mt-0.5',
  date: 'float-end ms-1 text-sm text-dimmed',
  description: 'mt-2 text-base',
  separator: 'hidden',
  ...props.ui,
}));

const itemsWithIndex = computed(() => props.items.map((item, index) => ({ ...item, index })));

const timelineContainer = ref(null);
const { y: windowY } = useWindowScroll();
const { top, height } = useElementBounding(timelineContainer);

// 💡 关键 1：跨组件持久化进度，确保返回时能“钉住”
const persistedProgress = useState<number>(`timeline-progress-${props.lineOffset}`, () => 0);
// 💡 关键 2：锁定标记，避开返回瞬间的布局抖动
const isLocked = ref(true);

onMounted(() => {
  // 给予极短的注水（Hydration）恢复时间
  setTimeout(() => {
    isLocked.value = false;
  }, 150);
});

const progress = computed(() => {
  // 场景 A：手动刷新重置，强制归零
  if (props.isResetting) return 0;

  // 场景 B：初始化/返回瞬间，直接使用持久化的值，实现“死死钉住”
  if (isLocked.value && persistedProgress.value > 0) {
    return persistedProgress.value;
  }

  // 场景 C：基础防御，如果高度异常，保持现状
  if (!timelineContainer.value || height.value <= 100) {
    return persistedProgress.value;
  }

  // 场景 D：正常滚动计算
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
  const triggerPoint = viewportHeight * props.triggerRatio;

  // 这里的 top.value 在返回瞬间是不准的，所以我们需要 isLocked 保护
  const elementTopRelativeDoc = top.value + windowY.value;
  const currentProgress = windowY.value + triggerPoint - (elementTopRelativeDoc + 40);
  const adjustableHeight = height.value - 80;

  if (adjustableHeight <= 0) return 0;

  const percentage = Math.min(Math.max((currentProgress / adjustableHeight) * 100, 0), 100);

  // 💡 只有在布局稳定且非加载更多时，才更新持久化状态
  if (!isLocked.value && !props.loadingMore) {
    persistedProgress.value = percentage;
  }

  return percentage;
});

const onBeforeEnter = (el: Element) => {
  const element = el as HTMLElement;
  element.style.opacity = '0';
  element.style.transform = `translateY(${props.yOffset}px)`;
};

const onEnter = (el: Element, done?: () => void) => {
  const element = el as HTMLElement;
  const index = Array.from(element.parentNode?.children || []).indexOf(element);

  // 如果是加载更多，延迟极小；如果是初始化，按索引排队
  const delay = props.loadingMore ? 0.05 : index * props.stagger;

  const animation = element.animate(
    [
      { opacity: 0, transform: `translateY(${props.yOffset}px)`, offset: 0 },
      { opacity: 1, transform: 'translateY(0)', offset: 1 },
    ],
    {
      duration: 600,
      delay: delay * 1000,
      fill: 'forwards',
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  );

  animation.finished.then(() => {
    done?.();
  });
};

// 💡 关键：处理 SSR 初始列表的动画
onMounted(() => {
  // 恢复进度条锁定
  setTimeout(() => {
    isLocked.value = false;
  }, 150);

  // 这里的逻辑是：如果页面一进来就有数据（SSR），手动对它们跑一遍动画
  if (props.items.length > 0) {
    const elements = document.querySelectorAll('.timeline-item-wrapper');
    elements.forEach((el) => {
      onBeforeEnter(el);
      onEnter(el);
    });
  }
});
</script>

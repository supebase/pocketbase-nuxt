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
import { calculateTimelineProgress, playStaggerAnimation } from '~/modules/common/animation-utils';

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

// UI 配置映射
const mergedUi = computed(() => ({
  wrapper: 'w-full overflow-hidden',
  title: '-mt-0.5',
  date: 'float-end ms-1 text-sm text-dimmed',
  description: 'mt-2 text-base',
  separator: 'hidden',
  ...props.ui,
}));

const itemsWithIndex = computed(() => props.items.map((item, index) => ({ ...item, index })));

// 滚动监听与进度计算
const timelineContainer = ref(null);
const { y: windowY } = useWindowScroll();
const { top, height } = useElementBounding(timelineContainer);

const persistedProgress = useState<number>(`timeline-progress-${props.lineOffset}`, () => 0);
const isLocked = ref(true);

onMounted(() => {
  setTimeout(() => {
    isLocked.value = false;
  }, 150);

  // 处理 SSR 初始数据的动画执行
  if (props.items.length > 0) {
    const elements = document.querySelectorAll('.timeline-item-wrapper');
    elements.forEach((el) => {
      onBeforeEnter(el);
      onEnter(el);
    });
  }
});

const progress = computed(() => {
  if (props.isResetting) return 0;
  if (isLocked.value && persistedProgress.value > 0) return persistedProgress.value;
  if (!timelineContainer.value || height.value <= 100) return persistedProgress.value;

  // 调用封装后的计算逻辑
  const currentPercentage = calculateTimelineProgress({
    height: height.value,
    top: top.value,
    windowY: windowY.value,
    triggerRatio: props.triggerRatio,
  });

  if (!isLocked.value && !props.loadingMore) {
    persistedProgress.value = currentPercentage;
  }

  return currentPercentage;
});

// 动画执行逻辑
const onBeforeEnter = (el: Element) => {
  const element = el as HTMLElement;
  element.style.opacity = '0';
  element.style.transform = `translateY(${props.yOffset}px)`;
};

const onEnter = (el: Element, done?: () => void) => {
  const element = el as HTMLElement;
  const index = Array.from(element.parentNode?.children || []).indexOf(element);
  const delay = props.loadingMore ? 0.05 : index * props.stagger;

  // 调用封装后的 Web Animation API 执行函数
  playStaggerAnimation(element, index, {
    delay,
    yOffset: props.yOffset,
  }).finished.then(() => {
    done?.();
  });
};
</script>

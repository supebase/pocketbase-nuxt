<template>
  <div
    ref="timelineContainer"
    class="relative">
    <div
      class="absolute top-8 bottom-8 w-0.5 z-0 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden"
      :style="{ left: lineOffset }">
      <div
        class="absolute top-0 w-full bg-primary will-change-[height] shadow-[0_0_8px_rgba(var(--color-primary-500),0.5)]"
        :class="{ 'transition-all duration-300 ease-out': !loadingMore && !isResetting }"
        :style="{ height: `${progress}%` }" />
    </div>

    <UTimeline
      v-bind="$attrs"
      :items="itemsWithIndex"
      :ui="mergedUi"
      class="relative z-10">
      <template
        v-for="(_, name) in $slots"
        #[name]="slotData">
        <slot
          :name="name"
          v-bind="slotData" />
      </template>
    </UTimeline>
  </div>
</template>

<script setup lang="ts">
import { useElementBounding, useWindowScroll } from "@vueuse/core";

interface Props {
  items: any[];
  loadingMore?: boolean;
  isResetting?: boolean;
  ui?: Record<string, any>;
  lineOffset?: string;
  triggerRatio?: number;
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  loadingMore: false,
  isResetting: false,
  ui: () => ({}),
  lineOffset: "15px", // 统一默认为 15px
  triggerRatio: 0.5,
});

const mergedUi = computed(() => ({
  title: "-mt-0.5",
  date: "float-end ms-1 text-sm text-dimmed",
  description: "mt-2 text-base",
  separator: "hidden",
  ...props.ui,
}));

const itemsWithIndex = computed(() => props.items.map((item, index) => ({ ...item, index })));

const timelineContainer = ref(null);
const { y: windowY } = useWindowScroll();
const { top, height } = useElementBounding(timelineContainer);

const progress = computed(() => {
  if (props.isResetting) return 0;
  if (!timelineContainer.value || height.value === 0) return 0;

  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 0;
  const triggerPoint = viewportHeight * props.triggerRatio;

  // 修正到底逻辑：
  // 当页面滚动使得 (容器顶部 + 容器高度) 到达触发点时，线应该 100%
  const elementTopRelativeDoc = top.value + windowY.value;

  // 这里的 40 是顶部的 padding 补偿，如果不减去，线会点亮得太早
  const currentProgress = windowY.value + triggerPoint - (elementTopRelativeDoc + 40);

  // 这里的可滑动总长度也需要减去偏移补偿，以保证终点精确
  const adjustableHeight = height.value - 80; // 减去上下各约 40px 的 padding

  const percentage = (currentProgress / adjustableHeight) * 100;

  return Math.min(Math.max(percentage, 0), 100);
});
</script>

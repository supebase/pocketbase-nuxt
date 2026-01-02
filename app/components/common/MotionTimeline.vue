<template>
  <div ref="timelineContainer" class="relative">
    <div
      class="absolute top-8 bottom-8 w-0.5 z-0 bg-neutral-100 dark:bg-neutral-800 overflow-hidden"
      :style="{ left: lineOffset }"
    >
      <div
        class="absolute top-0 w-full bg-primary rounded-full will-change-[height]"
        :class="{
          'transition-[height] duration-500 ease-out':
            !loadingMore && !isResetting,
          'transition-none': loadingMore,
        }"
        :style="{ height: `${progress}%` }"
      />
    </div>

    <UTimeline
      v-bind="$attrs"
      :items="itemsWithIndex"
      :ui="mergedUi"
      class="relative z-10"
    >
      <template v-for="(_, name) in $slots" #[name]="slotData">
        <slot :name="name" v-bind="slotData" :index="slotData.item?.index" />
      </template>
    </UTimeline>
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
}

const props = withDefaults(defineProps<Props>(), {
    items: () => [],
    loadingMore: false,
    isResetting: false,
    ui: () => ({}),
    lineOffset: '15px',
    triggerRatio: 0.5,
});

const mergedUi = computed(() => ({
    wrapper: 'w-full overflow-hidden',
    title: '-mt-0.5',
    date: 'float-end ms-1 text-sm text-dimmed',
    description: 'mt-2 text-base',
    separator: 'hidden',
    ...props.ui,
}));

const itemsWithIndex = computed(() =>
    props.items.map((item, index) => ({ ...item, index })),
);

const timelineContainer = ref(null);
const { y: windowY } = useWindowScroll();
const { top, height } = useElementBounding(timelineContainer);

// --- 新增：用于平滑过渡的参考高度 ---
const displayHeight = ref(0);

// 监听实际高度变化
watch(
    height,
    (newHeight) => {
      // 如果正在重置，直接同步高度
      if (props.isResetting) {
        displayHeight.value = newHeight;
        return;
      }

      // 关键：只有在非加载状态，或者高度真的变大时才更新
      // 这可以防止加载瞬间分母抖动
      if (!props.loadingMore && newHeight !== 0) {
        displayHeight.value = newHeight;
      }
    },
    { immediate: true },
);

const progress = computed(() => {
    if (props.isResetting) return 0;
    // 使用 displayHeight 替代原来的 height
    if (!timelineContainer.value || displayHeight.value === 0) return 0;

    const viewportHeight =
      typeof window !== 'undefined' ? window.innerHeight : 0;
    const triggerPoint = viewportHeight * props.triggerRatio;

    const elementTopRelativeDoc = top.value + windowY.value;
    const currentProgress =
      windowY.value + triggerPoint - (elementTopRelativeDoc + 40);

    // 这里的计算现在基于稳定的 displayHeight
    const adjustableHeight = displayHeight.value - 80;

    const percentage = (currentProgress / adjustableHeight) * 100;

    return Math.min(Math.max(percentage, 0), 100);
});
</script>

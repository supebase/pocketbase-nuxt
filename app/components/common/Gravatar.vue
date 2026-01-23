<template>
  <div class="gravatar-wrapper size-full">
    <slot
      :src="avatarUrl"
      :is-loaded="!isLoading && !hasError && !!avatarId"
      :is-loading="isLoading"
      :has-error="hasError"
    >
      <div
        class="relative overflow-hidden rounded-full size-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 group"
      >
        <div v-if="isLoading" class="absolute inset-0 z-30 flex items-center justify-center bg-inherit">
          <UIcon name="i-hugeicons:refresh" class="size-4 text-dimmed animate-spin" />
        </div>

        <img
          v-if="avatarId && !hasError"
          ref="imgRef"
          :src="avatarUrl"
          @load="handleLoad"
          @error="handleError"
          :class="[
            'object-cover size-full transition-all duration-700 ease-in-out',
            isLoading ? 'scale-110 opacity-0' : 'scale-100 opacity-100',
          ]"
        />

        <div v-if="hasError || (!avatarId && !isLoading)" class="flex items-center justify-center w-full h-full">
          <UIcon name="i-hugeicons:image-02" class="text-dimmed size-4.5" />
        </div>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  avatarId?: string | null;
  size?: number;
  rank?: string;
}>();

const imgRef = ref<HTMLImageElement | null>(null);

const { avatarUrl, isLoading, hasError, handleLoad, handleError } = useGravatar(() => props.avatarId, {
  size: props.size,
  rank: props.rank,
});

/**
 * 核心：处理浏览器缓存
 * 如果图片已经加载完成（从缓存读取），手动触发 handleLoad
 */
const checkImageComplete = () => {
  if (imgRef.value?.complete && imgRef.value?.naturalWidth !== 0) {
    handleLoad();
  }
};

onMounted(() => {
  checkImageComplete();
});

// 当 URL 改变时（如列表翻页），在 DOM 更新后再次检查
watch(avatarUrl, async (newVal) => {
  if (!newVal) return;
  await nextTick();
  checkImageComplete();
});
</script>

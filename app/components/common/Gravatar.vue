<template>
  <div
    class="relative overflow-hidden rounded-full size-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
    <div
      v-if="isLoading && !hasError"
      class="absolute inset-0 z-20 animate-pulse bg-neutral-300 dark:bg-neutral-700" />

    <img
      ref="imgRef"
      v-if="avatarId"
      :src="avatarUrl"
      @load="handleLoad"
      @error="handleError"
      class="object-cover size-full transition-opacity duration-300 z-10"
      :class="isLoading ? 'opacity-0' : 'opacity-100'" />

    <UIcon
      v-if="hasError || (!avatarId && !isLoading)"
      name="i-hugeicons:image-02"
      class="text-dimmed size-4 z-30" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  avatarId?: string | null;
  size?: number;
  rank?: string;
}>();

const imgRef = ref<HTMLImageElement | null>(null);

const { avatarUrl, isLoading, hasError, handleLoad, handleError } = useGravatar(
  () => props.avatarId,
  { size: props.size, rank: props.rank }
);

// 检查图片状态的通用逻辑
const checkImageComplete = () => {
  if (imgRef.value?.complete && imgRef.value?.naturalWidth !== 0) {
    handleLoad();
  }
};

onMounted(() => {
  checkImageComplete();
});

// 监听 avatarUrl 变化（例如列表翻页、用户切换 ID）
watch(avatarUrl, async (newVal) => {
  if (!newVal) return;
  await nextTick();
  checkImageComplete();
});
</script>

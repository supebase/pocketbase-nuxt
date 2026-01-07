<template>
  <div class="flex items-center justify-between w-full px-1.5">
    <div class="flex items-center gap-1 text-base tracking-widest text-dimmed font-semibold">
      <ClientOnly>
        <CommonAnimateNumber :value="count" /> 条内容
        <template #fallback> <CommonAnimateNumber :value="0" /> 条内容 </template>
      </ClientOnly>
    </div>
    <UIcon
      v-if="isRefreshing"
      name="i-hugeicons:refresh"
      class="size-4 text-dimmed cursor-not-allowed animate-spin"
    />
    <UIcon
      v-else-if="length > 0"
      name="i-hugeicons:refresh"
      class="size-4 text-dimmed cursor-pointer hover:text-primary transition-colors"
      @click="emit('refresh')"
    />
  </div>
</template>

<script setup lang="ts">
defineProps({
  count: {
    type: Number,
    default: 0,
  },
  isRefreshing: {
    type: Boolean,
    default: false,
  },
  length: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();
</script>

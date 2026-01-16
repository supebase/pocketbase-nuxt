<template>
  <div class="flex items-center justify-between w-full">
    <div class="flex items-center gap-1 text-[15px] tracking-widest text-muted mt-3">
      <ClientOnly>
        攒了 <CommonAnimateNumber :value="count" /> 篇
        <template #fallback> 攒了 <CommonAnimateNumber :value="0" /> 篇 </template>
      </ClientOnly>
      <div class="flex items-center ml-1">
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
    </div>
    <PostsButton :isLogin="isLogin" :userVerified="userVerified" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
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
  isLogin: {
    type: Boolean,
    default: false,
  },
  userVerified: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();
</script>

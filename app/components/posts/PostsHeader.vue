<template>
  <div class="flex items-center justify-between w-full min-h-11">
    <div class="flex items-center gap-1 text-[15px] tracking-widest text-muted mt-3">
      <ClientOnly>
        攒了 <CommonAnimateNumber :value="displayCount" /> 篇
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
    <Transition name="jelly-pop" appear>
      <div v-if="length > 0">
        <PostsButton :isLogin="isLogin" :userVerified="userVerified" />
      </div>
    </Transition>
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

const displayCount = ref(0);

watch(
  () => props.length,
  (newLen) => {
    if (newLen > 0) {
      // 当数据加载完的一瞬间，先确保它是 0
      displayCount.value = 0;

      // 关键：延迟一小会儿，避开组件初始化阶段，强制产生数值跳变
      setTimeout(() => {
        displayCount.value = props.count;
      }, 50); // 50ms 足够让浏览器和 Vue 完成一轮渲染循环
    } else {
      displayCount.value = 0;
    }
  },
  { immediate: true },
);

watch(
  () => props.count,
  (newCount) => {
    if (props.length > 0) {
      displayCount.value = newCount;
    }
  },
);
</script>

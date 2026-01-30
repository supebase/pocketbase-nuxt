<template>
  <div class="flex items-center justify-between w-full min-h-11">
    <div class="flex items-center gap-1 text-[15px] tracking-wide text-dimmed font-medium">
      <ClientOnly>
        攒了 <CommonAnimateNumber :value="displayCount" /> 篇
        <template #fallback> 攒了 <CommonAnimateNumber :value="0" /> 篇 </template>
      </ClientOnly>
      <div
        class="flex items-center ml-1 duration-500"
        :class="[displayCount > 0 ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-180']"
      >
        <UIcon
          name="i-hugeicons:refresh"
          class="size-4 text-dimmed transition-colors"
          :class="[
            isRefreshing || cooldown > 0
              ? 'animate-spin-slow cursor-not-allowed opacity-50'
              : 'cursor-pointer hover:text-primary',
            length === 0 && 'hidden',
          ]"
          @click="handleRefresh"
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
const cooldown = ref(0);
let timer: NodeJS.Timeout | null = null;

const handleRefresh = () => {
  if (props.isRefreshing || cooldown.value > 0 || props.length === 0) return;

  emit('refresh');
  startCooldown();
};

// 开启 10 秒倒计时
const startCooldown = () => {
  cooldown.value = 10;
  timer = setInterval(() => {
    if (cooldown.value > 0) {
      cooldown.value--;
    } else {
      stopCooldown();
    }
  }, 1000);
};

const stopCooldown = () => {
  if (timer) clearInterval(timer);
};

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

onUnmounted(() => stopCooldown());
</script>

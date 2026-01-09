<template>
  <div class="flex items-center justify-between w-full px-1.5">
    <div class="flex items-center gap-1 text-base tracking-widest text-dimmed font-semibold">
      <ClientOnly>
        攒了 <CommonAnimateNumber :value="count" /> 帖
        <template #fallback> 攒了 <CommonAnimateNumber :value="0" /> 帖 </template>
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
    <UButton
      v-bind="postButtonConfig"
      color="neutral"
      tabindex="-1"
      class="rounded-full"
      :ui="{ base: 'pr-3.5 py-1', leadingIcon: 'size-4.5' }"
    />
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

const postButtonConfig = computed(() => {
  const isLocked = props.isLogin && !props.userVerified;

  return {
    to: props.isLogin ? '/new' : '/auth',
    disabled: isLocked,
    label: isLocked ? '未认证' : '新帖文',
    icon: isLocked ? 'i-hugeicons:remove-circle' : 'i-hugeicons:add-01',
  };
});
</script>

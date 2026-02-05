<template>
  <UButton
    v-bind="postButtonConfig"
    tabindex="-1"
    color="neutral"
    :label="postButtonConfig.label"
    :icon="postButtonConfig.icon"
    :ui="{ base: 'px-4', leadingIcon: [postButtonConfig.disabled ? 'rotate-45' : ''] }"
  />
</template>

<script setup lang="ts">
const props = defineProps({
  isLogin: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

const postButtonConfig = computed(() => {
  const isLocked = props.isLogin && !props.isAdmin;

  return {
    to: props.isLogin ? '/new' : '/auth',
    disabled: isLocked,
    label: isLocked ? '未认证' : '新帖文',
    icon: isLocked ? 'i-hugeicons:remove-circle' : 'i-hugeicons:add-01',
  };
});
</script>

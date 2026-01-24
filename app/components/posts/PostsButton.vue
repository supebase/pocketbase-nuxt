<template>
  <UButton
    v-bind="postButtonConfig"
    tabindex="-1"
    variant="link"
    :ui="{
      base: 'group relative px-5 py-2.5 rounded-xl bg-white dark:bg-neutral-950 font-bold tracking-wider uppercase text-sm transition-all! duration-500 scale-105 hover:scale-100 border border-rose-500/40 dark:border-purple-500/40 hover:border-rose-500/5 dark:hover:border-purple-500/15 overflow-visible items-center justify-center',
      label: 'contents',
      leadingIcon: 'hidden',
      trailingIcon: 'hidden',
    }"
    :class="[postButtonConfig.disabled ? 'grayscale' : '']"
  >
    <template #default>
      <div class="flex items-center gap-2 relative z-10 text-default">
        <UIcon
          :name="postButtonConfig.icon"
          class="w-5 h-5 transition-transform duration-700 scale-125 group-hover:scale-100"
        />
        {{ postButtonConfig.label }}
      </div>

      <div
        class="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_50%_50%,var(--color-fuchsia-500),transparent_50%)]/10 dark:bg-[radial-gradient(circle_at_50%_50%,var(--color-purple-500),transparent_50%)]/10 opacity-100 group-hover:opacity-0 transition-all duration-500"
      ></div>

      <div
        class="absolute -inset-1 rounded-xl bg-neutral-900/10 blur-md dark:bg-linear-to-br dark:from-purple-600 dark:via-violet-600 dark:to-indigo-600 dark:opacity-20 dark:blur-xl opacity-100 group-hover:opacity-0 transition-all duration-500"
      ></div>

      <div
        class="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-pink-500 dark:via-purple-500 to-transparent scale-x-100 group-hover:scale-x-0 transition-transform duration-500"
      ></div>

      <div
        class="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-fuchsia-500 dark:via-indigo-500 to-transparent scale-x-100 group-hover:scale-x-0 transition-transform duration-700"
      ></div>
    </template>
  </UButton>
</template>

<script setup lang="ts">
const props = defineProps({
  isLogin: {
    type: Boolean,
    default: false,
  },
  userVerified: {
    type: Boolean,
    default: false,
  },
});

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

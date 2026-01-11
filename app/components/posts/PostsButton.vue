<template>
  <UButton
    v-bind="postButtonConfig"
    tabindex="-1"
    variant="link"
    color="neutral"
    :ui="{
      base: 'items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group relative animate-rainbow cursor-pointer border-0 [background-clip:padding-box,border-box,border-box] [background-origin:border-box] [border:calc(0.08*1rem)_solid_transparent] h-9 pr-3.5 inline-flex \
      /* 核心背景配置 - 浅色模式 */ \
      bg-[linear-gradient(#ffffff,#ffffff),linear-gradient(#f5f5f5_50%,rgba(248,250,252,0.6)_80%,rgba(248,250,252,0)),linear-gradient(90deg,hsl(0,100%,63%),hsl(90,100%,63%),hsl(210,100%,63%),hsl(195,100%,63%),hsl(270,100%,63%))] \
      bg-[length:200%] text-slate-900 \
      /* 核心背景配置 - 深色模式 */ \
      dark:bg-[linear-gradient(#171717,#171717),linear-gradient(#202020_50%,rgba(18,18,19,0.6)_80%,rgba(18,18,19,0)),linear-gradient(90deg,hsl(0,100%,63%),hsl(90,100%,63%),hsl(210,100%,63%),hsl(195,100%,63%),hsl(270,100%,63%))] \
      dark:text-white \
      /* 底部发光阴影 (Rainbow Glow) */ \
      before:absolute before:bottom-[-20%] before:left-1/2 before:z-[0] before:h-[20%] before:w-[60%] before:-translate-x-1/2 before:animate-rainbow before:bg-[linear-gradient(90deg,hsl(0,100%,63%),hsl(90,100%,63%),hsl(210,100%,63%),hsl(195,100%,63%),hsl(270,100%,63%))] before:[filter:blur(calc(0.8*1rem))]',
      leadingIcon: 'size-4.5',
    }"
  />
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

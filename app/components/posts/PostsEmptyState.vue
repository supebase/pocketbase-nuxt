<template>
  <div class="flex flex-col items-center justify-center space-y-4 min-h-[calc(100vh-20rem)]">
    <UEmpty variant="naked" :title="randomState?.title" :description="randomState?.desc" />
  </div>
</template>

<script setup lang="ts">
const emptyStates = [
  { title: '服务器在摸鱼', desc: '今天不想干活，并向你投来一个尴尬的微笑。' },
  { title: '内容正在热身', desc: '后台做拉伸运动，准备以最完美的姿势登场。' },
  { title: '体力值不足', desc: '内容加载需要 100 点体力，目前恢复中...' },
  { title: '被猫叼走了', desc: '内容刚才还在桌上，一眨眼就被猫主子拍下去了。' },
];

const randomState = computed(() => {
  return emptyStates[Math.floor(Math.random() * emptyStates.length)];
});
</script>

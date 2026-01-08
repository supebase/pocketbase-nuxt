<template>
  <div class="flex flex-col items-center justify-center space-y-4 min-h-[calc(100vh-14rem)] pt-16">
    <UEmpty
      variant="naked"
      title="糟糕！空空如也～"
      description="您可以点击刷新按钮尝试获取最新的数据"
      :actions="[
        {
          label: '刷新',
          color: 'neutral',
          loadingAuto: true,
          class: 'cursor-pointer',
          onClick: () => $emit('refresh'),
        },
      ]"
    />
  </div>
</template>

<script setup lang="ts">
defineEmits(['refresh']);
</script>

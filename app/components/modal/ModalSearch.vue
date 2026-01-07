<template>
  <div>
    <UButton
      color="neutral"
      variant="link"
      icon="i-hugeicons:search-01"
      class="rounded-full cursor-pointer focus:outline-none! focus-visible:ring-0!"
      @click="isOpen = true"
    />

    <UModal
      v-model:open="isOpen"
      :ui="{ overlay: 'backdrop-blur-xs', content: 'sm:max-w-2xl' }"
      title="Search"
      description="站内搜索"
    >
      <template #content>
        <CommonSearch @close="isOpen = false" />
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const isOpen = ref(false);

// 快捷键支持
defineShortcuts({
  meta_k: {
    usingInput: true,
    handler: () => {
      isOpen.value = !isOpen.value;
    },
  },
});
</script>

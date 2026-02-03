<template>
  <UPopover :ui="{ content: 'ring-0 shadow-none bg-transparent' }" v-model:open="isPickerVisible">
    <div class="mt-1.5">
      <UIcon
        name="i-hugeicons:smile"
        @click.stop="isPickerVisible = true"
        class="size-5 text-muted cursor-pointer hover:text-primary transition-colors"
      />
    </div>

    <template #content>
      <div class="p-2 drop-shadow-2xl select-none">
        <NuxtEmojiPicker
          native
          hide-search
          hide-group-icons
          hide-group-names
          disable-sticky-group-names
          disable-skin-tones
          :theme="colorMode.value === 'dark' ? 'dark' : 'light'"
          @select="handleEmojiSelect"
          :disabled-groups="[
            'animals_nature',
            'food_drink',
            'activities',
            'travel_places',
            'objects',
            'symbols',
            'flags',
          ]"
        />
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
const colorMode = useColorMode();
const isPickerVisible = ref(false);
const emit = defineEmits<{
  emoji: [val: string];
}>();

// 自动处理焦点，防止 Popover 开启时背景闪烁或键盘弹出
watch(isPickerVisible, (val) => {
  if (val && import.meta.client) {
    nextTick(() => {
      (document.activeElement as HTMLElement)?.blur();
    });
  }
});

const handleEmojiSelect = (emoji: { i: string }) => {
  if (emoji?.i) {
    emit('emoji', emoji.i);
    isPickerVisible.value = false;
  }
};
</script>

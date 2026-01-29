<template>
  <ClientOnly>
    <UButton
      :icon="nextTheme === 'dark' ? 'i-hugeicons:sun-03' : 'i-hugeicons:moon-02'"
      color="neutral"
      variant="link"
      class="rounded-full cursor-pointer"
      @click="handleToggle"
    />
    <template #fallback>
      <div class="size-8 flex items-center justify-center">
        <UIcon name="i-hugeicons:refresh" class="size-4.5 text-muted animate-spin" />
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { startThemeTransition } from '~/utils/common/animation-utils';

const colorMode = useColorMode();
const nextTheme = computed(() => (colorMode.value === 'dark' ? 'light' : 'dark'));

const handleToggle = (event: MouseEvent) => {
  startThemeTransition(event, () => {
    colorMode.preference = nextTheme.value;
  });
};
</script>

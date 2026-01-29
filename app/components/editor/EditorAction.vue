<template>
  <URadioGroup
    v-model="model"
    indicator="hidden"
    orientation="horizontal"
    variant="card"
    class="select-none w-full"
    :items="items"
    :ui="{
      item: 'items-center border-2 border-neutral-200/80 dark:border-neutral-800 justify-center whitespace-nowrap rounded-2xl text-sm font-medium bg-white dark:bg-neutral-950',
    }"
  />
</template>

<script setup lang="ts">
const model = defineModel<string>();
defineProps<{ items: any[] }>();
</script>

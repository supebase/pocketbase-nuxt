<template>
  <div class="flex items-center gap-2.5">
    <UFieldGroup v-if="action === 'partager'" class="w-full">
      <UInput
        v-model="icon"
        id="icon-field"
        placeholder="图标 i-simple-icons:nuxt"
        variant="outline"
        color="neutral"
        size="lg"
        class="w-full"
      />
      <UButton
        color="neutral"
        variant="outline"
        icon="i-hugeicons:folder-search"
        to="https://icones.js.org/collection/simple-icons"
        target="_blank"
      />
    </UFieldGroup>

    <UFieldGroup class="w-full">
      <UBadge color="neutral" variant="outline" size="lg" label="https://" />
      <UInput
        v-model="link"
        id="link-field"
        placeholder="卡片 example.com"
        variant="outline"
        color="neutral"
        size="lg"
        class="w-full"
      />
    </UFieldGroup>
  </div>
</template>

<script setup lang="ts">
const icon = defineModel<string>('icon');
const link = defineModel<string>('link');
defineProps<{ action: string }>();
</script>

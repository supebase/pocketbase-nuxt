<template>
  <UApp :locale="zh_cn">
    <UHeader :toggle="false">
      <template #title>
        <CommonLogo />
      </template>
    </UHeader>

    <UError
      :clear="{
        color: 'neutral',
        size: 'xl',
        class: 'rounded-full',
      }"
      :error="error"
    />

    <UFooter />
  </UApp>
</template>

<script setup lang="ts">
import { zh_cn } from '@nuxt/ui/locale';
import type { NuxtError } from '#app';

const props = defineProps<{
  error: NuxtError;
}>();
</script>

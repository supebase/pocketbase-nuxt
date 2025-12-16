<template>
  <UApp :locale="zh_cn">
    <NuxtLoadingIndicator />
    <UHeader :toggle="false">
      <template #title>
        <CommonLogo />
      </template>
      <template #right>
        <LayoutHeader />
      </template>
    </UHeader>

    <UMain class="max-w-md mx-auto">
      <UContainer>
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </UContainer>
    </UMain>
  </UApp>
</template>

<script setup lang="ts">
import { zh_cn } from "@nuxt/ui/locale";
</script>

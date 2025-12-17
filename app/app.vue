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

    <UMain class="max-w-lg mx-auto">
      <UContainer>
        <NuxtLayout>
          <NuxtPage :keepalive="{ max: 10 }" />
        </NuxtLayout>
      </UContainer>
    </UMain>
  </UApp>
</template>

<script setup lang="ts">
import { zh_cn } from "@nuxt/ui/locale";
</script>

<template>
  <UApp :locale="zh_cn" :toaster="appConfig.toaster">
    <NuxtLoadingIndicator />
    <UHeader :toggle="false">
      <template #title>
        <Transition mode="out-in" name="header-fade">
          <div v-if="showHeaderBack" key="back" class="flex items-center cursor-pointer"
            @click="$router.back()">
            <UIcon name="i-hugeicons:arrow-turn-backward" class="size-7 text-dimmed" />
          </div>

          <CommonLogo v-else key="logo" />
        </Transition>
      </template>
      <template #right>
        <LayoutHeader />
      </template>
    </UHeader>

    <UMain class="max-w-lg mx-auto">
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

const appConfig = useAppConfig();

const route = useRoute();
const { showHeaderBack } = useHeader();

watch(
  () => route.path,
  (newPath) => {
    // 只有回到根路径或特定页面时才自动隐藏
    if (newPath === '/') {
      showHeaderBack.value = false;
    }
  }
);
</script>

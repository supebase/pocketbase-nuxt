<template>
  <UApp
    :locale="zh_cn"
    :toaster="appConfig.toaster">
    <NuxtLoadingIndicator />
    <UHeader :toggle="false">
      <template #title>
        <Transition
          mode="out-in"
          name="header-fade">
          <div
            v-if="showHeaderBack"
            key="back"
            class="flex items-center cursor-pointer"
            @click="
              () => {
                showHeaderBack = false;
                $router.back();
              }
            ">
            <UIcon
              name="hugeicons:arrow-turn-backward"
              class="size-7 text-dimmed" />
          </div>

          <CommonLogo
            v-else
            key="logo" />
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

// 监听路由对象的变化，只要路径变了，就先隐藏返回图标
watch(
  () => route.path,
  () => {
    showHeaderBack.value = false;
  }
);
</script>


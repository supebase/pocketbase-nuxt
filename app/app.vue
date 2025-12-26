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

    <UMain class="max-w-xl mx-auto">
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
const { loggedIn } = useUserSession(); // 💡 获取 nuxt-auth-utils 状态
const { $pb } = useNuxtApp();

// --- 1. 路由与 Header 逻辑 ---
watch(
  () => route.path,
  (newPath) => {
    if (newPath === '/') {
      showHeaderBack.value = false;
    }
  }
);

// --- 2. 身份状态全局守护 (可选但推荐) ---
// 逻辑：如果 Nuxt Session 消失了（Cookie 过期），确保客户端 PB 实例也清理掉
watch(loggedIn, (isLogged) => {
  if (!isLogged && $pb.authStore.isValid) {
    $pb.authStore.clear();
  }
}, { immediate: true });
</script>

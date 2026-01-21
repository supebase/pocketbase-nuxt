<template>
  <UApp :locale="zh_cn" :toaster="appConfig.toaster">
    <NuxtLoadingIndicator />
    <UHeader :toggle="false">
      <template #title>
        <Transition mode="out-in" name="header-fade">
          <div
            v-if="showHeaderBack"
            key="back"
            class="header-back-wrapper flex items-center text-muted text-[15px] gap-0.5 cursor-pointer"
            @click="$router.back()"
          >
            <UIcon name="i-hugeicons:arrow-left-01" class="size-7" /> 返回
          </div>
          <CommonLogo v-else key="logo" />
        </Transition>
      </template>
      <template #right>
        <LayoutHeader />
      </template>
    </UHeader>

    <UMain class="max-w-150 mx-auto">
      <UContainer>
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </UContainer>
    </UMain>

    <LazyStatsOnline />
    <LazyCommonWeChatGuide />
  </UApp>
</template>

<script setup lang="ts">
import { zh_cn } from '@nuxt/ui/locale';
import { useDocumentVisibility } from '@vueuse/core';

const appConfig = useAppConfig();
const colorMode = useColorMode();
const { showHeaderBack } = useHeader();
const { loggedIn, fetch: fetchSession } = useUserSession();

// 身份状态清理
const pbAuth = useCookie('pb_auth', { path: '/' });

watch(loggedIn, (isLogged) => {
  if (isLogged === false) {
    pbAuth.value = null;
  }
});

// 标签页可见性监听
if (import.meta.client) {
  const visibility = useDocumentVisibility();
  // 增加一个简单的节流或冷却判断
  const lastFetchTime = ref(0);
  watch(visibility, (state) => {
    if (state === 'visible') {
      const now = Date.now();
      // 如果距离上次检查不足 1 分钟，就不重复请求
      if (now - lastFetchTime.value > 60000) {
        fetchSession();
        lastFetchTime.value = now;
      }
    }
  });
}

useHead({
  meta: [
    {
      id: 'theme-color',
      name: 'theme-color',
      content: () => (colorMode.value === 'dark' ? '#171717' : '#ffffff'),
    },
  ],
});
</script>

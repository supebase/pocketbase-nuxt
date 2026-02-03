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

    <UFooter>
      <ClientOnly>
        <LazyBuildEnvironment />
      </ClientOnly>
    </UFooter>

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
const { status: sseStatus, listen: sseListen } = usePocketRealtime();

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
  const lastCheckTime = ref(0);

  watch(visibility, (state) => {
    if (state === 'visible') {
      const now = Date.now();

      // 策略 A: 校验 Session (频率控制：1分钟)
      if (now - lastCheckTime.value > 60000) {
        fetchSession();
        lastCheckTime.value = now;
      }

      // 策略 B: 唤醒 SSE
      // 如果 SSE 当前是 offline (可能是因为重连次数超限)，且用户已登录
      // 只要调用一次 listen，内部逻辑就会重置计数器并尝试 connectPhysical
      if (sseStatus.value === 'offline' && loggedIn.value) {
        // console.log('[SSE] Tab visible, re-activating connection...');
        // 传入一个空回调即可触发内部重连逻辑，或者直接导出 connectPhysical
        sseListen(() => {});
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

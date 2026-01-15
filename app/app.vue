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
  </UApp>
</template>

<script setup lang="ts">
import { zh_cn } from '@nuxt/ui/locale';
import { useDocumentVisibility } from '@vueuse/core';

const appConfig = useAppConfig();
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
  watch(visibility, (state) => {
    if (state === 'visible') {
      fetchSession();
    }
  });
}
</script>

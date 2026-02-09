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

if (import.meta.client) {
  const visibility = useDocumentVisibility();
  watch(visibility, (state) => {
    if (state === 'visible') {
      fetchSession();
    }
  });
}

watch(loggedIn, (val) => {
  if (!val) {
    const pb = getClientPB();
    if (pb) pb.authStore.clear();
  }
});

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

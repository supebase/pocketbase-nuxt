<template>
  <UApp :locale="zh_cn" :toaster="appConfig.toaster">
    <NuxtLoadingIndicator />
    <UHeader :toggle="false">
      <template #title>
        <Transition mode="out-in" name="header-fade">
          <div
            v-if="showHeaderBack"
            key="back"
            class="flex items-center cursor-pointer"
            @click="$router.back()"
          >
            <UIcon
              name="i-hugeicons:arrow-turn-backward"
              class="size-7 text-dimmed"
            />
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
import { zh_cn } from '@nuxt/ui/locale';

const appConfig = useAppConfig();
const route = useRoute();
const { showHeaderBack } = useHeader();
const { loggedIn, fetch: fetchSession } = useUserSession();

// --- 1. 路由与 Header 逻辑 ---
watch(
	() => route.path,
	(newPath) => {
		if (newPath === '/') {
			showHeaderBack.value = false;
		}
	},
);

// --- 2. 身份状态全局守护 ---
watch(
	loggedIn,
	(isLogged) => {
		// 仅在客户端执行 Cookie 操作
		if (import.meta.client && !isLogged) {
			// 双重保险：确保清除 pb_auth Cookie
			document.cookie =
				'pb_auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
			// 如果你有一些全局的实时状态，也可以在这里重置
		}
	},
	{ immediate: false },
);

if (import.meta.client) {
	window.addEventListener('visibilitychange', () => {
		// 当用户切换回这个标签页时，自动刷新一次 Session 状态
		if (document.visibilityState === 'visible') {
			fetchSession();
		}
	});
}
</script>

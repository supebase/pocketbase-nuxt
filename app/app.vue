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
const { loggedIn, user } = useUserSession(); // 💡 结构出 user，更有助于判断
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

// --- 2. 身份状态全局守护 (核心修改) ---
/**
 * 逻辑：
 * 1. 当 loggedIn 变为 false：用户登出或 Session 过期，必须清理 PB 内存和订阅。
 * 2. 当 loggedIn 变为 true：用户刚登录，PB 的 authStore 通常由插件通过 pb_auth Cookie 恢复，
 * 但在此处监听可以作为第二道防线，确保 UI 状态和数据请求实例同步。
 */
watch(loggedIn, (isLogged) => {
  if (!isLogged) {
    // 💡 彻底清理客户端 PocketBase 状态
    $pb.authStore.clear();
    // 如果有需要验证的实时订阅 (Realtime)，建议在这里也执行取消订阅
    // $pb.collection('posts').unsubscribe(); 

    // console.log('会话已结束，PB 存储已清除');
  } else {
    // 💡 可选：如果已登录但 PB 无效（例如 pb_auth Cookie 被意外删了）
    // 可以在这里提示用户重新登录或尝试静默刷新
    if (!$pb.authStore.isValid) {
      console.warn('会话存在但缺少 PB 令牌');
    }
  }
}, {
  // 💡 建议在客户端挂载后再执行监听，避免 SSR 期间的 Hydration 冲突
  immediate: false
});
</script>

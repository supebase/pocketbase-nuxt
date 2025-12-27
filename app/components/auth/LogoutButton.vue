<template>
  <UButton @click="handleLogout" :loading="isPending" color="neutral" variant="link"
    icon="i-hugeicons:door-01" tabindex="-1" class="rounded-full cursor-pointer" />
</template>

<script setup lang="ts">
const { fetch: fetchSession } = useUserSession();
const { $pb } = useNuxtApp();
const isPending = ref(false);
const toast = useToast();

async function handleLogout() {
  if (isPending.value) return;

  isPending.value = true;
  try {
    // 1. 调用后端退出接口
    // 该接口已负责：clearUserSession (nuxt-auth-utils) 和 deleteCookie (pb_auth)
    await $fetch("/api/auth/logout", { method: "POST" });

    // 2. 立即清理客户端内存中的 AuthStore
    // 这会触发 $pb 的状态变更，并自动停止所有活跃的 Realtime 订阅
    $pb.authStore.clear();

    // 3. 同步本地 Session 状态
    // 执行此操作后，useUserSession().loggedIn 会变为 false
    await fetchSession();

    // 4. 跳转
    await navigateTo("/auth");
  } catch (err: any) {
    toast.add({
      title: "退出失败",
      description: err.data?.message || "服务器连接异常",
      icon: "i-hugeicons:alert-02",
      color: "error",
    });
  } finally {
    isPending.value = false;
  }
}
</script>
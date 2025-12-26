<template>
  <UButton @click="handleLogout" loading-auto color="neutral" variant="link"
    icon="i-hugeicons:door-01" tabindex="-1" class="rounded-full cursor-pointer" />
</template>

<script setup lang="ts">
const { fetch: fetchSession } = useUserSession();
const { $pb } = useNuxtApp(); // 💡 获取 PB 实例
const isPending = ref(false);
const toast = useToast();

async function handleLogout() {
  isPending.value = true;
  try {
    // 1. 调用后端接口清理 Nuxt Session 和移除 HttpOnly Cookie
    await $fetch("/api/auth/logout", { method: "POST" });

    // 2. 清理前端 PocketBase 实例及其 AuthStore 💡
    // 这会自动移除浏览器中我们手动管理的 pb_auth Cookie
    $pb.authStore.clear();

    // 3. 刷新 Nuxt Session 状态
    await fetchSession();

    // 4. 跳转至登录页
    await navigateTo("/auth");
  } catch (err: any) {
    toast.add({
      title: "操作失败",
      description: err.data?.message || "无法完成退出操作",
      icon: "i-hugeicons:alert-02",
      color: "error",
    });
  } finally {
    isPending.value = false;
  }
}
</script>
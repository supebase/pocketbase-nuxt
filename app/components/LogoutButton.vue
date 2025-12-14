<template>
  <button @click="handleLogout">退出登录</button>
</template>

<script setup lang="ts">
const { fetch: fetchSession } = useUserSession();

async function handleLogout() {
  try {
    // 调用 SSR 退出路由
    await $fetch("/api/auth/logout", {
      method: "POST",
    });

    // 退出成功后，立即调用 navigateTo 进行跳转
    await fetchSession();
    await navigateTo("/auth");
  } catch (error) {
    console.error("Logout failed:", error);
    alert("退出失败，请稍后再试。");
  }
}
</script>

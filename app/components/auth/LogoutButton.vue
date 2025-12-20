<template>
  <UButton
    @click="handleLogout"
    :loading="isPending"
    color="neutral"
    variant="link"
    icon="hugeicons:door-01"
    class="rounded-full cursor-pointer" />
</template>

<script setup lang="ts">
const { fetch: fetchSession } = useUserSession();
const isPending = ref(false);
const toast = useToast();

async function handleLogout() {
  isPending.value = true;
  try {
    await $fetch("/api/auth/logout", { method: "POST" });
    await fetchSession();
    await navigateTo("/auth");
  } catch (err: any) {
    toast.add({
      title: "操作失败",
      description: err.data?.message || "无法完成退出操作",
      icon: "hugeicons:alert-02",
      color: "error",
    });
  } finally {
    isPending.value = false;
  }
}
</script>

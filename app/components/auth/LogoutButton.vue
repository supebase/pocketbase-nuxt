<template>
  <UButton
    @click="handleLogout"
    :loading="isLoggingOut"
    color="neutral"
    variant="link"
    icon="i-hugeicons:door-01"
    tabindex="-1"
    class="rounded-full cursor-pointer"
  />
</template>

<script setup lang="ts">
const { handleLogout, isLoggingOut } = useAuth();
</script>

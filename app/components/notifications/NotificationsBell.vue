<template>
  <div class="flex items-center">
    <UChip :show="unreadCount > 0" inset>
      <UButton
        to="/notifications"
        :icon="unreadCount === 0 ? 'hugeicons:notification-snooze-01' : 'i-hugeicons:notification-01'"
        variant="link"
        color="neutral"
        tabindex="-1"
        :disabled="unreadCount === 0"
        :class="[isRinging ? 'animate-swing' : '']"
      />
    </UChip>
  </div>
</template>

<script setup lang="ts">
const { unreadCount, isRinging, fetchUnreadCount, setupRealtime } = useNotifications();

onMounted(() => {
  fetchUnreadCount();
  setupRealtime();
});
</script>

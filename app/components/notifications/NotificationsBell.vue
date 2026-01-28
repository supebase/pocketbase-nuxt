<template>
  <div class="flex items-center">
    <UChip :show="unreadCount > 0" inset>
      <UButton
        to="/notifications"
        :icon="unreadCount === 0 ? 'hugeicons:notification-snooze-01' : 'i-hugeicons:notification-01'"
        variant="link"
        color="neutral"
        tabindex="-1"
        :class="[isRinging ? 'animate-swing' : '']"
      />
    </UChip>
  </div>
</template>

<script setup lang="ts">
const { user, loggedIn } = useUserSession();
const { listen } = usePocketRealtime();

const unreadCount = ref(0);
const isRinging = ref(false);

const fetchInitialCount = async () => {
  if (!loggedIn.value || !user.value?.id) return;
  try {
    const res = await $fetch<any>('/api/collections/notification', {
      query: { page: 1, perPage: 1, filter: 'is_read = false' },
    });
    unreadCount.value = res.data?.totalItems || 0;
  } catch (e) {
    console.error('Failed to fetch unread count', e);
  }
};

const triggerEffect = () => {
  isRinging.value = true;
  setTimeout(() => (isRinging.value = false), 1200);
};

onMounted(() => {
  fetchInitialCount();
  listen(({ collection, action, record }) => {
    if (collection !== 'notifications' || record.to_user !== user.value?.id) return;
    if (action === 'create' && !record.is_read) {
      unreadCount.value++;
      triggerEffect();
    } else if (action === 'update' && record.is_read) {
      fetchInitialCount();
    } else if (action === 'delete' && !record.is_read) {
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    }
  });
});

watch(loggedIn, (val) => {
  if (val) fetchInitialCount();
  else unreadCount.value = 0;
});
</script>

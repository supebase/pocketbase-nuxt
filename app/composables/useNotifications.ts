import type { NotificationRecord, NotificationsApiResult } from '~/types';

export const useNotifications = () => {
  const notifications = useState<NotificationRecord[]>('notifications_list', () => []);
  const page = ref(1);
  const hasMore = ref(false);
  const isMarkingAll = ref(false);
  const loadingMore = ref(false);

  const { user } = useUserSession();
  const { listen } = usePocketRealtime();

  // 1. 获取通知列表逻辑
  const { pending, refresh } = useFetch<NotificationsApiResult>('/api/collections/notification', {
    query: { page, perPage: 10 },
    server: false, // 仅客户端运行
    onResponse({ response }) {
      if (response._data?.data) {
        const { items, totalPages } = response._data.data;
        if (page.value === 1) {
          notifications.value = items;
        } else {
          const existingIds = new Set(notifications.value.map((n) => n.id));
          const uniqueItems = items.filter((n) => !existingIds.has(n.id));
          notifications.value.push(...uniqueItems);
        }
        hasMore.value = page.value < totalPages;
      }
    },
  });

  // 2. 实时监听逻辑
  const setupRealtime = () => {
    listen(async ({ collection, action, record }) => {
      if (collection === 'notifications' && action === 'create' && record.to_user === user.value?.id) {
        if (notifications.value.find((n) => n.id === record.id)) return;

        try {
          const res = await $fetch<any>(`/api/collections/notification/${record.id}`);
          if (res.data && page.value === 1) {
            notifications.value.unshift(res.data as NotificationRecord);
            if (notifications.value.length > 10) notifications.value.pop();
          }
        } catch (e) {
          console.error('实时通知解析失败:', e);
        }
      }
    });
  };

  // 3. 操作方法
  const markAllAsRead = async () => {
    if (isMarkingAll.value) return;
    isMarkingAll.value = true;
    try {
      await $fetch('/api/collections/notification', { method: 'PATCH' });
      notifications.value.forEach((n) => (n.is_read = true));
    } finally {
      isMarkingAll.value = false;
    }
  };

  const markAsRead = async (item: NotificationRecord) => {
    if (item.is_read) return;
    const originalStatus = item.is_read;
    item.is_read = true; // 乐观更新
    try {
      await $fetch(`/api/collections/notification/${item.id}`, { method: 'PATCH' });
    } catch {
      item.is_read = originalStatus; // 失败回滚
    }
  };

  const loadMore = async () => {
    if (loadingMore.value || !hasMore.value) return;
    loadingMore.value = true;
    page.value++;
    await refresh();
    loadingMore.value = false;
  };

  const resetAndRefresh = () => {
    page.value = 1;
    refresh();
  };

  return {
    notifications,
    pending,
    hasMore,
    isMarkingAll,
    loadingMore,
    markAllAsRead,
    markAsRead,
    loadMore,
    resetAndRefresh,
    setupRealtime,
  };
};

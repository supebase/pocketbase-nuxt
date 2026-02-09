import type { NotificationRecord, NotificationsApiResult } from '~/types';

export const useNotifications = () => {
  const notifications = useState<NotificationRecord[]>('notifications_list', () => []);
  const unreadCount = useState<number>('notifications_unread_count', () => 0);

  const page = ref(1);
  const hasMore = ref(false);
  const isMarkingAll = ref(false);
  const loadingMore = ref(false);
  const isRinging = ref(false);

  const { user } = useUserSession();
  const { listen, close: pbClose } = usePocketRealtime();

  const triggerEffect = () => {
    isRinging.value = true;
    setTimeout(() => (isRinging.value = false), 1200);
  };

  // 获取未读总数
  const fetchUnreadCount = async () => {
    try {
      const res = await $fetch<any>('/api/collections/notification', {
        query: { page: 1, perPage: 1, filter: 'is_read = false' },
      });
      unreadCount.value = res.totalItems || 0;
    } catch (e) {
      console.error('获取未读数失败:', e);
    }
  };

  // 获取通知列表逻辑
  const { pending, refresh } = useFetch<NotificationsApiResult>('/api/collections/notification', {
    query: { page, perPage: 10 },
    server: false,
    watch: [page],
    onResponse({ response }) {
      const rawData = response._data;
      if (rawData && rawData.items) {
        const { items, totalPages } = rawData;
        if (page.value === 1) {
          notifications.value = items;
        } else {
          const existingIds = new Set(notifications.value.map((n) => n.id));
          const uniqueItems = items.filter((n: any) => !existingIds.has(n.id));
          notifications.value.push(...uniqueItems);
        }
        hasMore.value = page.value < totalPages;
      }
    },
  });

  // 实时监听逻辑
  const setupRealtime = () => {
    pbClose('notifications');

    listen(
      'notifications',
      async ({ action, record }) => {
        if (record.to_user !== user.value?.id) return;

        if (action === 'create') {
          unreadCount.value++;
          triggerEffect();

          if (page.value === 1) {
            try {
              const res = await $fetch<any>(`/api/collections/notification/${record.id}`);
              const newItem = res.data || res;

              if (!notifications.value.find((n) => n.id === newItem.id)) {
                notifications.value.unshift(newItem);
              }
            } catch (e) {
              console.error(e);
            }
          }
        } else if (action === 'update' || action === 'delete') {
          fetchUnreadCount();
        }
      },
      { expand: 'from_user' },
    );
  };

  // 操作方法
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

    try {
      await $fetch(`/api/collections/notification/${item.id}`, { method: 'PATCH' });
      item.is_read = true;
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    } catch (e) {
      console.error('标记已读失败:', e);
    }
  };

  const loadMore = async () => {
    if (loadingMore.value || !hasMore.value) return;
    loadingMore.value = true;
    page.value++;
    loadingMore.value = false;
  };

  const resetAndRefresh = async () => {
    if (page.value === 1) {
      await refresh();
    } else {
      page.value = 1;
    }
  };

  const close = () => pbClose('notifications');

  return {
    notifications,
    unreadCount,
    pending,
    hasMore,
    isRinging,
    isMarkingAll,
    loadingMore,
    markAllAsRead,
    markAsRead,
    loadMore,
    fetchUnreadCount,
    resetAndRefresh,
    setupRealtime,
    close,
  };
};

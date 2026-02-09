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
    // 基础防御：如果没有用户信息，直接返回，不发起连接
    if (!user.value?.id) return;

    listen(
      'notifications',
      async ({ action, record }) => {
        if (record.to_user !== user.value?.id) return;

        if (action === 'create') {
          unreadCount.value++;
          triggerEffect();

          // 无论在哪一页，新数据的产生通常意味着分页数据发生了偏移
          // 如果当前不在第一页，我们需要标记 hasMore 为 true，确保用户往回翻或加载时能感知到变化
          if (page.value !== 1) {
            hasMore.value = true;
            return; // 只有不在第一页才直接跳过 unshift
          }

          // 第一页的内存实时更新
          if (!notifications.value.find((n) => n.id === record.id)) {
            const newItem: NotificationRecord = {
              ...record,
              relativeTime: useRelativeTime(record.created),
            } as any;

            notifications.value.unshift(newItem);

            if (notifications.value.length > 10) {
              notifications.value.pop();
              hasMore.value = true;
            }
          }
        } else if (action === 'update') {
          // 查找本地列表是否有这条记录
          const index = notifications.value.findIndex((n) => n.id === record.id);
          if (index !== -1) {
            const wasUnread = !notifications.value[index]?.is_read;
            const isNowRead = record.is_read;

            // 同步本地状态
            notifications.value[index] = { ...notifications.value[index], ...record };

            // 如果是从未读变为已读，直接减去计数，不用重新 fetch
            if (wasUnread && isNowRead) {
              unreadCount.value = Math.max(0, unreadCount.value - 1);
            }
          }
        } else if (action === 'delete') {
          // 同理，如果是删除未读项，减计数
          const index = notifications.value.findIndex((n) => n.id === record.id);
          if (index !== -1 && !notifications.value[index]?.is_read) {
            unreadCount.value = Math.max(0, unreadCount.value - 1);
          }
          notifications.value = notifications.value.filter((n) => n.id !== record.id);
        }
      },
      { expand: 'from_user', filter: `to_user = "${user.value.id}"` },
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

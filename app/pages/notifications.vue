<template>
  <ClientOnly>
    <div class="flex items-center justify-between pt-4 select-none">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">提醒</h2>
        <p class="text-sm text-neutral-500">
          当前页面有 {{ notifications.filter((n) => !n.is_read).length }} 条未读消息
        </p>
      </div>
      <UButton
        v-if="notifications.length > 0"
        variant="link"
        color="neutral"
        class="cursor-pointer"
        tabindex="-1"
        icon="i-hugeicons:checkmark-circle-03"
        @click="handleMarkAllAsRead"
      >
        全部标记为已读
      </UButton>
    </div>

    <div class="space-y-4 pb-12">
      <TransitionGroup name="notification-list">
        <div
          v-for="item in notifications"
          :key="item.id"
          class="relative group cursor-pointer"
          @click="handleJump(item)"
        >
          <div
            class="flex gap-3 p-4 rounded-lg bg-neutral-100 dark:bg-neutral-800 transition-all duration-300"
            :class="[item.is_read ? 'opacity-40' : 'opacity-100']"
          >
            <div class="relative shrink-0">
              <CommonGravatar :avatar-id="item.expand?.from_user?.avatar" :size="40" class="size-8" />
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {{ item.expand?.from_user?.name }}
                </span>
                <span class="text-[13px] text-dimmed font-medium tracking-tight">回应了你的评论</span>
                <time class="text-xs text-dimmed font-medium">
                  {{ useRelativeTime(item.created).value }}
                </time>
              </div>

              <p class="text-[14px] text-muted leading-snug line-clamp-2">
                {{ cleanComment(item.expand?.comment?.comment) }}
              </p>
            </div>

            <div v-if="!item.is_read" class="flex items-center">
              <div class="size-2.5 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--color-primary-500),0.6)]" />
            </div>
          </div>
        </div>
      </TransitionGroup>

      <div v-if="hasMore" class="pt-6 flex flex-col items-center gap-4">
        <button class="text-sm font-bold text-muted cursor-pointer" @click="loadMore">查看以前的消息</button>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { NotificationRecord, NotificationsApiResult } from '~/types';

const notifications = ref<NotificationRecord[]>([]);
const page = ref(1);
const hasMore = ref(false);
const isMarkingAll = ref(false);
const loadingMore = ref(false);

const { user } = useUserSession();
const { listen } = usePocketRealtime();

// 1. 获取通知列表逻辑
const { pending, refresh } = await useFetch<NotificationsApiResult>('/api/collections/notification', {
  query: { page, perPage: 10 },
  // 关键：强制让这个请求只在客户端运行，避免服务端认证丢失问题
  server: false,
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

// 2. KeepAlive 激活时重置并刷新
onActivated(() => {
  page.value = 1;
  refresh();
});

// 3. 实时监听：新消息直接插到列表头部
onMounted(() => {
  listen(async ({ collection, action, record }) => {
    // 基础过滤
    if (collection === 'notifications' && action === 'create' && record.to_user === user.value?.id) {
      // 避免重复
      if (notifications.value.find((n) => n.id === record.id)) return;

      try {
        const res = await $fetch<any>(`/api/collections/notification/${record.id}`);

        if (res.data && page.value === 1) {
          // 将带 expand 的完整对象插入列表
          notifications.value.unshift(res.data as NotificationRecord);

          // 可选：为了保持简约，如果列表太长，可以去掉末尾一个
          if (notifications.value.length > 10) {
            notifications.value.pop();
          }
        }
      } catch (e) {
        console.error('实时通知解析失败:', e);
      }
    }
  });
});

// 4. 全部标记已读
const handleMarkAllAsRead = async () => {
  if (isMarkingAll.value) return;
  isMarkingAll.value = true;
  try {
    await $fetch('/api/collections/notification', { method: 'PATCH' });
    notifications.value.forEach((n) => (n.is_read = true));
  } finally {
    isMarkingAll.value = false;
  }
};

// 5. 点击跳转并标记已读
const handleJump = async (item: NotificationRecord) => {
  if (!item.is_read) {
    // 乐观更新 UI
    item.is_read = true;
    $fetch(`/api/collections/notification/${item.id}`, { method: 'PATCH' }).catch(() => {
      item.is_read = false; // 失败则回滚
    });
  }

  // 跳转到文章。如果你有评论锚点，记得带上：`/${item.post}#comment-${item.comment}`
  navigateTo(`/${item.post}`);
};

// 6. 分页加载
const loadMore = async () => {
  if (loadingMore.value) return;
  loadingMore.value = true;
  page.value++;
  await refresh();
  loadingMore.value = false;
};

// 过滤内容中的 @用户 标签
const cleanComment = (text?: string) => {
  if (!text) return '';
  // 正则说明：匹配 @ 符号后跟着非空白字符，直到遇到空格或结束
  // 如果你的用户名包含特殊字符，可以根据实际格式调整正则，如 /@[\u4e00-\u9fa5\w-]+/g
  return text.replace(/@([^\s@#$!%^&*()]+)/g, '').trim();
};
</script>

<template>
  <ClientOnly>
    <div class="flex items-center justify-between pt-4 select-none">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">提醒</h2>
        <p class="text-sm text-neutral-500">当前页面有 {{ unreadCount }} 条未读消息</p>
      </div>
      <UButton
        v-if="notifications.length > 0"
        variant="link"
        color="neutral"
        class="cursor-pointer"
        tabindex="-1"
        icon="i-hugeicons:checkmark-circle-03"
        :loading="isMarkingAll"
        @click="markAllAsRead"
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
              <CommonAvatar
                :avatar-id="item.expand?.from_user?.avatar"
                :avatar-github="item.expand?.from_user?.avatar_github"
                :user-id="item.expand?.from_user?.id"
                :size="40"
                class="size-8"
              />
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
        <button class="text-sm font-bold text-muted cursor-pointer" :disabled="loadingMore" @click="loadMore">
          {{ loadingMore ? '加载中...' : '查看以前的消息' }}
        </button>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { NotificationRecord } from '~/types';

const {
  notifications,
  unreadCount,
  hasMore,
  isMarkingAll,
  loadingMore,
  markAllAsRead,
  markAsRead,
  loadMore,
  resetAndRefresh,
  setupRealtime,
} = useNotifications();

// 生命周期
onMounted(() => {
  setupRealtime();
  resetAndRefresh();
});

onActivated(() => {
  resetAndRefresh();
});

// 处理跳转
const handleJump = async (item: NotificationRecord) => {
  await markAsRead(item);
  navigateTo(`/${item.post}`);
};

// 文本处理
const cleanComment = (text?: string) => {
  if (!text) return '';
  return text.replace(/@([^\s@#$!%^&*()]+)/g, '').trim();
};
</script>

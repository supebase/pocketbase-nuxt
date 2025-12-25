<template>
  <div class="flex mt-2.5 h-6">
    <div v-if="status === 'pending'" class="flex items-center">
      <UIcon name="i-hugeicons:refresh" class="size-5 text-dimmed animate-spin" />
    </div>

    <template v-else-if="usersToShow.length === 1">
      <div class="flex items-center gap-2">
        <div class="size-5.5 rounded-full overflow-hidden">
          <CommonGravatar :avatar-id="usersToShow[0]?.expand?.user?.avatar" :size="32" />
        </div>
        <span class="text-sm font-medium text-dimmed" v-if="!allowComment">评论已关闭</span>
        <span class="text-sm font-medium text-dimmed" v-else>{{
          usersToShow[0]?.expand?.user?.name
          }} 发表了评论</span>
      </div>
    </template>

    <div v-else-if="usersToShow.length > 1" class="flex -space-x-0.5 overflow-hidden">
      <div v-for="(comment, index) in usersToShow.slice(0, 3)" :key="comment.id"
        class="inline-block size-5.5 rounded-full ring-2 ring-white dark:ring-neutral-900 overflow-hidden"
        :style="{ zIndex: 10 - (index as number) }">
        <CommonGravatar :avatar-id="comment.expand?.user?.avatar" :size="32" />
      </div>
      <UBadge v-if="usersToShow.length > 3" variant="soft" size="sm" color="neutral"
        class="rounded-xl text-muted text-xs">
        +{{ remainingCount }}
      </UBadge>
      <span class="text-sm font-medium text-dimmed mt-0.5 ml-3" v-if="!allowComment">评论已关闭</span>
    </div>

    <div v-else-if="!allowComment" class="flex items-center gap-2 text-sm text-dimmed">
      <UIcon name="i-hugeicons:comment-block-02" class="size-4.5" />
      <span class="text-sm">评论已关闭</span>
    </div>

    <div v-else class="flex items-center gap-2 text-sm text-dimmed">
      <UIcon name="i-hugeicons:comment-02" class="size-4.5" />
      <span class="text-sm">暂无评论</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CommentsListResponse } from "~/types/comments";

const props = defineProps({
  postId: { type: String, required: true },
  allowComment: { type: Boolean, default: true },
});

// 1. 优化 Key：确保 key 是唯一的，且能对应该组件实例
const cacheKey = computed(() => `comments-preview-${props.postId}`);

const { data: commentsResponse, status, refresh } = await useLazyFetch<CommentsListResponse>(`/api/collections/comments`, {
  key: cacheKey.value,
  server: true,
  query: {
    filter: `post="${props.postId}"`,
    sort: "-created",
    page: 1,
    perPage: 5,
  },
  // 2. 移除 dedupe: "cancel"，这在快速滚动列表时会导致大量请求被取消从而显示不正常
  // 3. 增加 pick 减少负载（可选）
  watch: [() => props.postId], // 监听 ID 变化
});

const forceRefresh = () => {
  // 只有在客户端且非挂载中状态才执行，避免 SSR 冲突
  if (import.meta.client) {
    refresh();
  }
};

onMounted(() => {
  // 无论有没有数据，挂载时都请求最新状态
  // 这能解决“返回首页”时，由于 Nuxt Keep-alive 或路由缓存导致的数据过期
  forceRefresh();
});

// 如果你的 app 使用了 <keep-alive> 或 <NuxtPage keepalive />
onActivated(() => {
  forceRefresh();
});

const usersToShow = computed(() => commentsResponse.value?.data?.comments || []);
const totalCount = computed(() => commentsResponse.value?.data?.totalItems || 0);
const remainingCount = computed(() => Math.max(0, totalCount.value - 3));
</script>

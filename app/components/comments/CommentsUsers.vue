<template>
  <div ref="target" class="flex mt-2.5 h-6">
    <div v-if="status === 'pending' && usersToShow.length === 0" class="flex items-center">
      <UIcon name="i-hugeicons:refresh" class="size-5 text-dimmed animate-spin" />
    </div>

    <template v-else-if="usersToShow.length > 0">
      <div class="flex items-center">
        <div class="flex -space-x-1 overflow-hidden">
          <div v-for="(comment, index) in usersToShow.slice(0, 3)" :key="comment.id"
            class="inline-block size-5.5 rounded-full ring-2 ring-white dark:ring-neutral-900 overflow-hidden"
            :style="{ zIndex: 10 - index }">
            <CommonGravatar :avatar-id="comment.expand?.user?.avatar" :size="32" />
          </div>
        </div>

        <UBadge v-if="totalCount > 1" variant="soft" size="sm" color="neutral"
          class="rounded-xl text-muted text-xs ml-1.5 px-1.5">
          +{{ remainingCount }}
        </UBadge>

        <span class="text-sm font-medium text-dimmed ml-2 truncate max-w-40">
          {{
            !allowComment
              ? '评论已关闭'
              : totalCount === 1
                ? `${usersToShow[0]?.expand?.user?.name} 发表了评论`
                : '参与了评论'
          }}
        </span>
      </div>
    </template>

    <div v-else class="flex items-center gap-2 text-sm text-dimmed">
      <UIcon :name="!allowComment ? 'i-hugeicons:comment-block-02' : 'i-hugeicons:comment-02'"
        class="size-4.5" />
      <span class="text-sm">{{ !allowComment ? '评论已关闭' : '暂无评论' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CommentsListResponse } from '~/types/comments';
import { useIntersectionObserver } from '@vueuse/core';

const props = defineProps({
  postId: { type: String, required: true },
  allowComment: { type: Boolean, default: true },
});

const target = ref(null);
const isRendered = ref(false);
const lastFetchTime = ref(0);
const REFRESH_THRESHOLD = 60 * 1000; // 首页预览不需要太频繁，改为 60 秒

// 1. 视口监听：进入视口才标记为可渲染
useIntersectionObserver(
  target,
  ([entry]) => {
    if (entry?.isIntersecting && !isRendered.value) {
      isRendered.value = true;
    }
  },
  { threshold: 0.1 }
);

// 2. 数据获取
const {
  data: commentsResponse,
  status,
  refresh,
} = await useLazyFetch<CommentsListResponse>(`/api/collections/comments`, {
  key: `comments-preview-${props.postId}`,
  // 💡 只有当 isRendered 变为 true 时才发起请求
  immediate: false,
  watch: [isRendered],
  query: {
    post: props.postId, // 💡 对齐后端 API 参数
    page: 1,
    perPage: 5,
  },
  onResponse() {
    lastFetchTime.value = Date.now();
  },
});

// 3. 智能刷新逻辑
const smartRefresh = () => {
  if (!isRendered.value || status.value === 'pending') return;
  if (Date.now() - lastFetchTime.value > REFRESH_THRESHOLD) {
    refresh();
  }
};

onActivated(() => {
  // 从详情页返回时，如果已经在视口内，尝试刷新过期数据
  if (isRendered.value) smartRefresh();
});

// 4. 数据转化
// 使用 Set 对用户 ID 去重，预览位展示的是“有哪些人参与”，而不是“最新的三条评论”
const usersToShow = computed(() => {
  const comments = commentsResponse.value?.data?.comments || [];
  const seenUsers = new Set();
  return comments
    .filter((c) => {
      const userId = c.expand?.user?.id;
      if (!userId || seenUsers.has(userId)) return false;
      seenUsers.add(userId);
      return true;
    })
    .slice(0, 3);
});

const totalCount = computed(() => commentsResponse.value?.data?.totalItems || 0);
const remainingCount = computed(() => Math.max(0, totalCount.value - usersToShow.value.length));
</script>

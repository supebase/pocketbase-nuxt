<template>
  <div ref="target" class="flex mt-2.5 h-6">
    <div v-if="isRendered && status === 'pending'" class="flex items-center">
      <UIcon name="i-hugeicons:refresh" class="size-5 text-dimmed animate-spin" />
    </div>

    <template v-else-if="usersToShow.length > 0">
      <div v-if="usersToShow.length === 1" class="flex items-center gap-2">
        <div class="size-5.5 rounded-full overflow-hidden">
          <CommonGravatar :avatar-id="usersToShow[0]?.expand?.user?.avatar" :size="32" />
        </div>
        <span class="text-sm font-medium text-dimmed">
          {{ !allowComment ? '评论已关闭' : `${usersToShow[0]?.expand?.user?.name} 发表了评论` }}
        </span>
      </div>
      <div v-else class="flex items-center">
        <div class="flex -space-x-0.5 overflow-hidden">
          <div v-for="(comment, index) in usersToShow.slice(0, 3)" :key="comment.id"
            class="inline-block size-5.5 rounded-full ring-2 ring-white dark:ring-neutral-900 overflow-hidden"
            :style="{ zIndex: 10 - index }">
            <CommonGravatar :avatar-id="comment.expand?.user?.avatar" :size="32" />
          </div>
        </div>
        <UBadge v-if="totalCount > 3" variant="soft" size="sm" color="neutral"
          class="rounded-xl text-muted text-xs ml-1">
          +{{ remainingCount }}
        </UBadge>
        <span class="text-sm font-medium text-dimmed ml-3">{{ !allowComment ? '评论已关闭' : '' }}</span>
      </div>
    </template>

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
import { useIntersectionObserver } from "@vueuse/core";

const props = defineProps({
  postId: { type: String, required: true },
  allowComment: { type: Boolean, default: true },
});

const target = ref(null);
const isRendered = ref(false);
const lastFetchTime = ref(0); // 记录上次请求的时间戳
const REFRESH_THRESHOLD = 30 * 1000; // 刷新阈值：30秒

// 使用 VueUse 监听元素是否进入可视区域
const { stop } = useIntersectionObserver(
  target,
  (entries) => {
    // 💡 检查 entries 是否存在且有元素
    const entry = entries[0];
    if (entry && entry.isIntersecting) {
      isRendered.value = true;
      stop(); // 触发后停止监听，节省性能
    }
  }
);

// 1. 优化 Key：确保 key 是唯一的，且能对应该组件实例
const cacheKey = computed(() => `comments-preview-${props.postId}`);

const { data: commentsResponse, status, refresh } = await useLazyFetch<CommentsListResponse>(`/api/collections/comments`, {
  key: cacheKey.value,
  server: true,
  immediate: false,
  query: {
    filter: `post="${props.postId}"`,
    sort: "-created",
    page: 1,
    perPage: 5,
    pick: ['expand.user.name', 'expand.user.avatar'],
  },
  // 2. 移除 dedupe: "cancel"，这在快速滚动列表时会导致大量请求被取消从而显示不正常
  // 3. 增加 pick 减少负载（可选）
  // watch: [() => props.postId], // 监听 ID 变化
  // 监听渲染状态，一旦进入视图则触发刷新
  watch: [isRendered],
  // 每次请求成功后更新时间戳
  onResponse() {
    lastFetchTime.value = Date.now();
  }
});

/**
 * 智能刷新函数
 * 只有在：1.已渲染 2.非加载中 3.距离上次请求超过阈值 时才真正执行
 */
const smartRefresh = () => {
  if (!isRendered.value || status.value === 'pending') return;

  const now = Date.now();
  if (now - lastFetchTime.value > REFRESH_THRESHOLD) {
    refresh();
  }
};

// 3. 处理从详情页返回首页时的逻辑
// 如果你的页面使用了 <NuxtPage keepalive />
onActivated(() => {
  smartRefresh();
});

// 如果没有使用 keep-alive，普通的挂载逻辑
onMounted(() => {
  if (isRendered.value) {
    smartRefresh();
  }
});

const usersToShow = computed(() => commentsResponse.value?.data?.comments || []);
const totalCount = computed(() => commentsResponse.value?.data?.totalItems || 0);
const remainingCount = computed(() => Math.max(0, totalCount.value - 3));
</script>

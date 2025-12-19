<template>
  <div class="flex flex-col items-center justify-center">
    <div
      v-if="status !== 'pending' || isRefreshing"
      class="flex items-center justify-center w-full gap-4">
      <div class="flex items-center gap-1 text-base tracking-widest text-dimmed font-semibold">
        <CommonAnimateNumber :value="totalItems" /> 条贴文
      </div>
      <UIcon
        v-if="isRefreshing"
        name="hugeicons:refresh"
        class="size-4.25 text-muted cursor-not-allowed animate-spin" />
      <UIcon
        v-else-if="allPosts.length > 0"
        name="hugeicons:refresh"
        class="size-4.25 text-muted cursor-pointer hover:text-primary transition-colors"
        @click="manualRefresh" />
    </div>

    <div
      v-if="status === 'pending' && !isRefreshing"
      class="fixed inset-0 flex justify-center items-center">
      <UIcon
        name="svg-spinners:ring-resize"
        class="size-7 text-primary" />
    </div>

    <UAlert
      v-else-if="error"
      :title="error.message"
      variant="soft"
      color="error"
      class="mt-4" />

    <div
      v-else-if="!allPosts || allPosts.length === 0"
      class="flex flex-col items-center justify-center space-y-4 min-h-[calc(100vh-14rem)] pt-16">
      <UIcon
        name="hugeicons:file-empty-02"
        class="text-4xl text-neutral-300 dark:text-neutral-700" />
      <p class="text-neutral-400 dark:text-neutral-700 text-sm font-medium">信息矩阵仍处待填充态</p>
    </div>

    <div
      v-else
      class="mt-8 space-y-4 w-full">
      <CommonMotionTimeline
        :items="displayItems"
        :loading-more="isLoadingMore"
        line-offset="15px"
        :trigger-ratio="0.55"
        :is-resetting="isResetting">
        <template #indicator="{ item }">
          <div
            v-if="item.icon"
            class="flex items-center justify-center size-8 rounded-full bg-white dark:bg-neutral-900 ring-3 ring-white dark:ring-neutral-900 shadow-sm overflow-hidden">
            <UIcon
              :name="item.icon"
              class="size-6 text-primary" />
          </div>
          <CommonGravatar
            v-else
            :avatar-id="item.avatarId"
            :size="64" />
        </template>

        <template #title="{ item }">
          <div class="flex items-center gap-3">
            <div class="text-base">{{ item.title }}</div>
          </div>
        </template>

        <template #date="{ item }">
          <div class="flex items-center gap-2.5">
            {{ item.date }}
            <!-- <UIcon
              name="hugeicons:more-horizontal"
              class="size-5" /> -->
          </div>
        </template>

        <template #description="{ item, index }">
          <div
            :key="item.id"
            class="record-item-animate"
            :style="{ '--delay': `${(index % 10) * 0.08}s` }">
            <ULink
              :to="`/${item.id}`"
              class="line-clamp-5">
              {{ cleanMarkdown(item.description) }}
            </ULink>
            <CommentsCommentUsers
              :post-id="item.id"
              :allow-comment="item.allowComment" />
          </div>
        </template>
      </CommonMotionTimeline>

      <div class="flex justify-center mt-8 mb-4">
        <UButton
          v-if="hasMore"
          :loading="isLoadingMore"
          variant="soft"
          color="neutral"
          class="cursor-pointer"
          @click="handleLoadMore">
          加载更多
        </UButton>
        <USeparator
          v-else
          label="已经到底了"
          type="dashed" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PostRecord, PostsResponse } from "~/types/posts";
import { cleanMarkdown } from "~/utils/index";

const { isRefreshing, isResetting, refreshPostsAndComments } = useRefresh();
const {
  allItems: allPosts,
  currentPage,
  totalItems,
  isLoadingMore,
  hasMore,
  loadMore,
  resetPagination,
} = usePagination<PostRecord>();

// API 获取逻辑
const fetchPostsApi = async (page: number) => {
  const res = await $fetch<PostsResponse>("/api/posts/records", { query: { page } });
  return { items: res.data.posts, total: res.data.totalItems };
};

// SSR 初始加载
const {
  data: fetchResult,
  status,
  error,
  refresh,
} = await useLazyFetch<PostsResponse>("/api/posts/records", {
  key: "posts-list-data",
  server: true,
});

// 监听数据初始化
watch(
  fetchResult,
  (res) => {
    if (res?.data.page === 1) {
      resetPagination(res.data.posts || [], res.data.totalItems || 0);
    }
  },
  { immediate: true }
);

// 交互逻辑
const manualRefresh = () => refreshPostsAndComments(refresh, allPosts, currentPage);
const handleLoadMore = () => loadMore(fetchPostsApi);

const displayItems = computed(() => {
  return allPosts.value.map((item) => ({
    id: item.id,
    title: item.expand?.user?.name,
    date: useRelativeTime(item.created).value,
    description: item.content,
    action: item.action,
    allowComment: item.allow_comment,
    icon: item.icon,
    avatarId: item.expand?.user?.avatar,
  }));
});

onActivated(() => {
  if (allPosts.value.length === 0 && status.value !== "pending") {
    manualRefresh();
  }
});
</script>

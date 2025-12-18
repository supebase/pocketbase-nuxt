<template>
  <div class="flex flex-col items-center justify-center">
    <div
      v-if="status !== 'pending' || isRefreshing"
      class="flex items-center justify-between w-full">
      <div class="flex items-center gap-2 text-lg text-muted font-semibold">
        贴文 <CommonAnimateNumber :value="totalItems" /> 条
      </div>

      <div>
        <UIcon
          v-if="isRefreshing"
          name="hugeicons:reload"
          class="size-5 text-muted animate-spin" />
        <UIcon
          v-else-if="allPosts.length > 0"
          name="hugeicons:reload"
          class="size-5 text-muted cursor-pointer hover:text-primary transition-colors"
          @click="manualRefresh" />
      </div>
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
        :trigger-ratio="0.7"
        :is-resetting="isResetting">
        <template #indicator="{ item }">
          <div
            v-if="item.icon"
            class="flex items-center justify-center size-8 rounded-full bg-white dark:bg-neutral-900 ring-3 ring-white dark:ring-neutral-900 shadow-sm overflow-hidden">
            <UIcon
              :name="item.icon"
              class="size-6 text-primary" />
          </div>
          <UAvatar
            v-else
            :src="item.avatar?.src"
            class="object-cover size-full" />
        </template>

        <template #title="{ item }">
          <span class="text-base mr-2">{{ item.title }}</span>
          <span
            v-if="item.action === 'partager'"
            class="text-sm text-dimmed"
            >和大家分享</span
          >
        </template>

        <template #date="{ item }">
          {{ item.date }}
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
          @click="loadMore"
          :loading="isLoadingMore"
          :disabled="isLoadingMore"
          variant="soft"
          color="neutral"
          size="md"
          class="cursor-pointer">
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

// ----------------------------------------
// 状态管理
// ----------------------------------------
const allPosts = ref<PostRecord[]>([]);
const currentPage = ref(1);
const isRefreshing = ref(false);
const isLoadingMore = ref(false);
const isResetting = ref(false);

// ----------------------------------------
// 1. 核心请求逻辑
// ----------------------------------------
const fetchData = async (page: number) => {
  const response = await $fetch<PostsResponse>("/api/posts/records", {
    query: { page },
  });
  return response.data;
};

// 初始加载 (SSR)
const {
  data: fetchResult,
  status,
  error,
} = await useLazyFetch<PostsResponse>("/api/posts/records", {
  server: true,
  dedupe: "cancel",
});

watch(
  fetchResult,
  (newResult) => {
    if (newResult?.data.page === 1 && newResult?.data.posts) {
      allPosts.value = newResult.data.posts;
      currentPage.value = 1;
    }
  },
  { immediate: true }
);

// ----------------------------------------
// 2. 计算属性
// ----------------------------------------
const totalItems = computed(() => fetchResult.value?.data.totalItems || 0);
const hasMore = computed(() => allPosts.value.length < totalItems.value);

const displayItems = computed(() => {
  return allPosts.value.map((item) => ({
    id: item.id,
    title: item.expand?.user?.name,
    date: useRelativeTime(item.created).value,
    description: item.content,
    action: item.action,
    allowComment: item.allow_comment,
    ...(item.icon
      ? { icon: item.icon }
      : {
          avatar: { src: `https://gravatar.loli.net/avatar/${item.expand?.user?.avatar}?s=64` },
        }),
  }));
});

// ----------------------------------------
// 3. 交互函数
// ----------------------------------------

/**
 * 手动刷新逻辑
 */
const manualRefresh = async () => {
  if (isRefreshing.value) return;
  try {
    isRefreshing.value = true;
    isResetting.value = true;

    // 1. 刷新文章
    const data = await fetchData(1);

    // 2. 强制刷新评论头像 Key
// 注意：用 refresh 而不是 clear，这样能确保正在显示的组件重新进入 pending
// 遍历所有帖子，刷新对应的评论数据缓存
allPosts.value.forEach(post => {
  refreshNuxtData(`comments-data-${post.id}`);
});

    if (data?.posts) {
      allPosts.value = data.posts;
      currentPage.value = 1;
    }
  } catch (err) {
    console.error("刷新失败:", err);
  } finally {
    isRefreshing.value = false;
    isResetting.value = false;
  }
};

const loadMore = async () => {
  if (isLoadingMore.value || !hasMore.value) return;
  try {
    isLoadingMore.value = true;
    const nextPage = currentPage.value + 1;
    const data = await fetchData(nextPage);
    if (data?.posts?.length) {
      allPosts.value = [...allPosts.value, ...data.posts];
      currentPage.value = nextPage;
    }
  } finally {
    isLoadingMore.value = false;
  }
};

onActivated(() => {
  if (allPosts.value.length === 0 && status.value !== "pending") {
    manualRefresh();
  }
});
</script>

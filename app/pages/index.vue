<template>
  <div class="flex flex-col items-center justify-center">
    <div class="flex items-center gap-2 text-xl font-semibold">
      <CommonAnimateNumber :value="totalItems" /> 条贴文

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
      class="mt-8 space-y-4">
      <UTimeline
        :items="
          processedPosts.map((item) => ({
            id: item.id,
            title: item.expand?.user?.name,
            date: item.relativeTime,
            description: item.content,
            action: item.action,
            ...(item.icon && { icon: item.icon }),
            ...(!item.icon && {
              avatar: {
                src: `https://gravatar.loli.net/avatar/${item.expand?.user?.avatar}?s=64&r=G`,
              },
            }),
            allowComment: item.allow_comment,
            verified: item.expand?.user?.verified,
          }))
        "
        :default-value="1"
        :ui="{
          title: '-mt-0.5',
          date: 'float-end ms-1 text-sm text-dimmed',
          description: 'mt-2 text-base',
        }">
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

        <template #description="{ item }">
          <ULink
            :to="`/${item.id}`"
            class="line-clamp-5"
            >{{ cleanMarkdown(item.description) }}</ULink
          >
          <div
            v-if="!item.allowComment"
            class="flex items-center gap-2 text-sm mt-2 text-dimmed">
            <UIcon
              name="hugeicons:comment-block-02"
              class="size-5" />
            评论已关闭
          </div>

          <CommentsCommentUsers
            :post-id="item.id"
            v-if="item.allowComment" />
        </template>
      </UTimeline>
      <div class="flex justify-center mt-8 mb-4">
        <UButton
          v-if="hasMore"
          @click="loadMore"
          :loading="isLoadingMore"
          :disabled="isLoadingMore"
          variant="soft"
          color="primary"
          size="md">
          加载更多
        </UButton>
        <div
          v-else
          class="text-sm text-dimmed">
          没有更多数据了
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PostRecord, PostsResponse } from "~/types/posts";
import { cleanMarkdown } from "~/utils/index";
import { useRelativeTime } from "~/composables/utils/useRelativeTime";

// ----------------------------------------
// 状态管理
// ----------------------------------------
const isRefreshing = ref(false); // 用于控制刷新时的加载图标
const currentPage = ref(1); // 当前页码
const isLoadingMore = ref(false); // 用于控制“加载更多”按钮的加载状态
const allPosts = ref<PostRecord[]>([]); // 存储所有已加载的贴文

// ----------------------------------------
// 1. 数据获取 (useLazyFetch)
// ----------------------------------------
const {
  data: fetchResult,
  status,
  error,
  refresh: refreshPosts,
} = await useLazyFetch<PostsResponse>("/api/posts/records", {
  server: true,
  dedupe: "cancel",
  cache: "no-cache",
});

// ----------------------------------------
// 2. 初始化和数据同步
// ----------------------------------------
watch(
  fetchResult,
  (newResult) => {
    // 确保只有在成功获取第 1 页数据时才重置
    if (newResult?.data.page === 1 && newResult?.data.posts) {
      allPosts.value = newResult.data.posts;
      currentPage.value = 1;
    }
  },
  { immediate: true }
);

// ----------------------------------------
// 3. Computed 属性
// ----------------------------------------
const totalItems = computed(() => fetchResult.value?.data.totalItems || 0);
const hasMore = computed(() => allPosts.value.length < totalItems.value);

// 处理相对时间计算
const processedPosts = computed(() => {
  return allPosts.value.map((item) => {
    const relativeTime = useRelativeTime(item.created).value;
    return {
      ...item,
      relativeTime,
    };
  });
});

// ----------------------------------------
// 4. 刷新逻辑 (onActivated) - 修正核心逻辑
// ----------------------------------------
// 仅在组件被激活，且当前列表没有数据（如首次加载失败）时，才重新加载第一页。
// 如果列表中已经有数据（即从详情页返回），则不进行任何操作，保持缓存状态。
onActivated(async () => {
  if (allPosts.value.length === 0 && (status.value === "success" || status.value === "error")) {
    try {
      isRefreshing.value = true;
      currentPage.value = 1;
      await refreshPosts();
    } catch (err) {
      console.error("激活时刷新失败:", err);
    } finally {
      isRefreshing.value = false;
    }
  }
});

// ----------------------------------------
// 4.1. 新增：手动刷新函数 (绑定到顶部图标)
// ----------------------------------------
const manualRefresh = async () => {
  try {
    isRefreshing.value = true;
    currentPage.value = 1; // 明确刷新，重置页码
    await refreshPosts(); // 重新获取第 1 页数据，watch 钩子会重置 allPosts
  } catch (err) {
    console.error("手动刷新失败:", err);
  } finally {
    isRefreshing.value = false;
  }
};

// ----------------------------------------
// 5. 加载更多数据 (loadMore)
// ----------------------------------------
const loadMore = async () => {
  if (isLoadingMore.value || !hasMore.value) return;

  try {
    isLoadingMore.value = true;
    const nextPage = currentPage.value + 1;

    const response = await $fetch<PostsResponse>("/api/posts/records", {
      query: {
        page: nextPage,
      },
      cache: "no-cache",
    });

    if (response.data.posts && response.data.posts.length > 0) {
      allPosts.value = [...allPosts.value, ...response.data.posts];
      currentPage.value = nextPage;
    }
  } catch (err) {
    console.error("加载更多失败:", err);
  } finally {
    isLoadingMore.value = false;
  }
};
</script>

<template>
  <div class="flex flex-col items-center justify-center">
    <div class="flex items-center gap-2 text-xl font-semibold">
      <CommonAnimateNumber :value="totalItems" /> 条贴文
      <UIcon
        v-if="isRefreshing"
        name="hugeicons:reload"
        class="size-5 text-muted animate-spin" />
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
      v-else-if="!posts || posts.length === 0"
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
          <ULink :to="`/${item.id}`">{{ cleanMarkdown(item.description) }}</ULink>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PostRecord } from "~/types/posts";
import { cleanMarkdown } from "~/utils/index";
import { useRelativeTime } from "~/composables/utils/useRelativeTime";

const isRefreshing = ref(false);

const {
  data,
  status,
  error,
  refresh: refreshPosts,
} = await useLazyFetch<{
  message: string;
  data: {
    posts: PostRecord[];
    totalItems: number;
    page: number;
    perPage: number;
  };
}>("/api/posts/records", {
  server: true,
  dedupe: "cancel",
});

const posts = computed(() => data.value?.data.posts || []);
const totalItems = computed(() => data.value?.data.totalItems || 0);

// 处理相对时间计算
const processedPosts = computed(() => {
  return posts.value.map((item) => {
    const relativeTime = useRelativeTime(item.created).value;
    return {
      ...item,
      relativeTime,
    };
  });
});

onActivated(async () => {
  try {
    isRefreshing.value = true;
    await refreshPosts();
  } finally {
    isRefreshing.value = false;
  }
});
</script>

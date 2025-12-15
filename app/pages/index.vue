<template>
  <div class="flex flex-col items-center justify-center">
    <div class="flex items-center gap-2 text-xl font-semibold">
      <AnimateNumber :value="totalItems" /> 条贴文
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
        class="size-7 text-primary-500" />
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
      <UBlogPost
        v-for="post in posts"
        :key="post.id"
        :description="post.content"
        :date="post.created"
        :authors="[
          {
            name: post.expand?.user?.name,
            avatar: {
              src: `https://gravatar.loli.net/avatar/${post.expand?.user?.avatar}?s=64&r=G`,
            },
          },
        ]"
        class="w-96" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PocketBasePostRecord } from "~/types/auth.d";

const isRefreshing = ref(false);

const {
  data,
  status,
  error,
  refresh: refreshPosts,
} = await useLazyFetch<{
  message: string;
  data: {
    posts: PocketBasePostRecord[];
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

onActivated(async () => {
  try {
    isRefreshing.value = true;
    await refreshPosts();
  } finally {
    isRefreshing.value = false;
  }
});
</script>

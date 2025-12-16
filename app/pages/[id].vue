<template>
  <div class="container mx-auto px-4 py-8">
    <UAlert
      v-if="error"
      :title="error.message"
      variant="soft"
      color="error"
      class="mt-4 max-w-4xl mx-auto" />

    <div
      v-else-if="status === 'pending'"
      class="max-w-4xl mx-auto flex justify-center items-center py-16 min-h-[calc(100vh-14rem)]">
      <UIcon
        name="svg-spinners:ring-resize"
        class="size-7 text-primary" />
    </div>

    <div
      v-else-if="postWithRelativeTime"
      class="max-w-4xl mx-auto">
      <div class="flex items-center gap-2 text-gray-500 mb-6">
        <span>{{ postWithRelativeTime.expand?.user?.name }}</span>
        <span>•</span>
        <span>{{ postWithRelativeTime.relativeTime }}</span>
      </div>
      <div class="mt-8">
        <MDC :value="postWithRelativeTime.content" />
      </div>

      <CommentsCommentForm
        v-if="loggedIn && postWithRelativeTime"
        :post-id="postWithRelativeTime.id"
        @comment-created="handleCommentCreated"
        class="mt-8" />

      <!-- 使用新创建的 CommentList 组件 -->
      <CommentsCommentList
        :post-id="postWithRelativeTime.id"
        ref="commentListRef" />
    </div>

    <div
      v-else
      class="flex flex-col items-center justify-center space-y-4 min-h-[calc(100vh-14rem)] pt-16">
      <UIcon
        name="hugeicons:file-empty-02"
        class="text-4xl text-neutral-300 dark:text-neutral-700" />
      <p class="text-neutral-400 dark:text-neutral-700 text-sm font-medium">文章不存在或已被删除</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PostRecord } from "~/types/posts";
import type { CommentRecord } from "~/types/comments";
import { useRelativeTime } from "~/composables/utils/useRelativeTime";

const { loggedIn } = useUserSession();

const route = useRoute();
const { id } = route.params;

// --- 获取帖子详情 ---
const { data, status, error } = await useLazyFetch<{
  message: string;
  data: PostRecord;
}>(`/api/posts/${id}`, {
  server: true,
  dedupe: "cancel",
});

const post = computed(() => data.value?.data || null);

// 为帖子添加相对时间
const postWithRelativeTime = computed(() => {
  if (!post.value) return null;
  const relativeTime = useRelativeTime(post.value.created).value;
  return {
    ...post.value,
    relativeTime,
  };
});

// 评论列表组件引用
const commentListRef = ref<any>(null);

// 处理新评论创建事件
const handleCommentCreated = (newComment: CommentRecord) => {
  // 为新评论添加相对时间
  const relativeTime = useRelativeTime(newComment.created).value;
  const commentWithRelativeTime = {
    ...newComment,
    relativeTime,
  };

  // 调用评论列表组件的方法添加新评论
  if (commentListRef.value) {
    commentListRef.value.handleCommentCreated?.(commentWithRelativeTime);
  }
};
</script>

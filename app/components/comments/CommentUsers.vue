<template>
  <div class="flex mt-2.5 h-6">
    <div v-if="status === 'pending'" class="flex items-center">
      <UIcon name="hugeicons:reload" class="size-5 text-dimmed animate-spin" />
    </div>

    <template v-else-if="usersToShow.length === 1">
      <div class="flex items-center gap-2">
        <div class="size-5.5 rounded-full overflow-hidden">
          <CommonGravatar :avatar-id="usersToShow[0]?.expand?.user?.avatar" :size="32" />
        </div>
        <span class="text-xs font-medium text-dimmed">{{ usersToShow[0]?.expand?.user?.name }}</span>
      </div>
    </template>

    <div v-else-if="usersToShow.length > 1" class="flex -space-x-0.5 overflow-hidden">
      <div
        v-for="(comment, index) in usersToShow.slice(0, 3)"
        :key="comment.id"
        class="inline-block size-5.5 rounded-full ring-2 ring-white dark:ring-neutral-900 overflow-hidden"
        :style="{ zIndex: 10 - index }"
      >
        <CommonGravatar :avatar-id="comment.expand?.user?.avatar" :size="32" />
      </div>
      <div 
        v-if="usersToShow.length > 3" 
        class="flex items-center justify-center size-5.5 rounded-full bg-neutral-100 dark:bg-neutral-800 ring-2 ring-white dark:ring-neutral-900 text-[10px] text-dimmed z-0"
      >
        +{{ usersToShow.length - 3 }}
      </div>
    </div>

    <div v-else-if="!allowComment" class="flex items-center gap-2 text-sm text-dimmed">
      <UIcon name="hugeicons:comment-block-02" class="size-4.5" />
      <span class="text-xs">评论已关闭</span>
    </div>

    <div v-else class="flex items-center gap-2 text-sm text-dimmed">
      <UIcon name="hugeicons:comment-02" class="size-4.5" />
      <span class="text-xs">暂无评论</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CommentRecord } from "~/types/comments";

const props = defineProps({
  postId: { type: String, required: true },
  allowComment: { type: Boolean, default: true },
});

const cacheKey = computed(() => `comments-data-${props.postId}`);

const { data: commentsResponse, status } = await useLazyFetch<{
  data: { comments: CommentRecord[] };
}>(`/api/comments/records`, {
  key: cacheKey.value,
  server: true,
  query: {
    filter: `post="${props.postId}"`,
    sort: "-created",
  },
  dedupe: "cancel",
  default: () => ({ data: { comments: [] } }),
});

const usersToShow = computed(() => commentsResponse.value?.data?.comments || []);
</script>
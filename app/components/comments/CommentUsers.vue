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

const cacheKey = computed(() => `comments-data-${props.postId}`);

// 注意：这里解构出 totalItems
const { data: commentsResponse, status } = await useLazyFetch<CommentsListResponse>(`/api/collections/comments`, {
  key: cacheKey.value,
  server: true,
  query: {
    filter: `post="${props.postId}"`,
    sort: "-created",
    page: 1,
    perPage: 5, // 预览依然只取 5 个头像
  },
  dedupe: "cancel",
  default: () => ({
    message: '',
    data: {
      comments: [],
      totalItems: 0,
      page: 1,
      perPage: 5
    }
  }),
});

// 计算属性：用于循环的头像（前3个）
const usersToShow = computed(() => commentsResponse.value?.data?.comments || []);

// 计算属性：总评论数
const totalCount = computed(() => commentsResponse.value?.data?.totalItems || 0);

// 计算属性：剩余隐藏的人数
const remainingCount = computed(() => Math.max(0, totalCount.value - 3));
</script>

<template>
  <div class="flex mt-2.5 h-6">
    <div
      v-if="status === 'pending'"
      class="flex items-center">
      <UIcon
        name="hugeicons:reload"
        class="size-5 text-dimmed animate-spin" />
    </div>

    <template v-else-if="usersToShow.length === 1">
      <UUser
        :name="usersToShow[0]?.expand?.user?.name"
        :avatar="{
          src: getAvatarUrl(usersToShow[0]?.expand?.user?.avatar),
          icon: 'hugeicons:image-03',
        }"
        size="xs" />
    </template>

    <UAvatarGroup
      v-else-if="usersToShow.length > 1"
      :max="3"
      size="xs">
      <UAvatar
        v-for="comment in usersToShow"
        :key="comment.id"
        :src="getAvatarUrl(comment.expand?.user?.avatar)"
        :alt="comment.expand?.user?.name" />
    </UAvatarGroup>

    <div
      v-else-if="!allowComment"
      class="flex items-center gap-2 text-sm text-dimmed">
      <UIcon
        name="hugeicons:comment-block-02"
        class="size-5" />
      评论已关闭
    </div>

    <div
      v-else
      class="flex items-center gap-2 text-sm text-dimmed">
      <UIcon
        name="hugeicons:comment-02"
        class="size-5" />
      暂无评论
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CommentRecord } from "~/types/comments";

const props = defineProps({
  postId: { type: String, required: true },
  allowComment: { type: Boolean, default: true },
});

const nuxtApp = useNuxtApp();
// 定义唯一 Key，用于跨页面精准刷新
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

const getAvatarUrl = (avatarId?: string) => {
  if (!avatarId) return undefined;
  return `https://gravatar.loli.net/avatar/${avatarId}?s=64&r=G`;
};
</script>

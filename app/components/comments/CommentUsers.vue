<template>
  <div class="flex mt-2">
    <div
      v-if="status === 'pending'"
      class="flex items-center">
      <UIcon
        name="hugeicons:reload"
        class="size-6 text-dimmed animate-spin" />
    </div>

    <UUser
      v-else-if="usersToShow.length === 1"
      v-for="comment in usersToShow"
      :key="comment.id"
      :name="comment.expand?.user?.name"
      :avatar="{
        src: `https://gravatar.loli.net/avatar/${comment.expand?.user?.avatar}?s=64&r=G`,
        icon: 'hugeicons:image-03',
      }"
      size="xs" />

    <UAvatarGroup
      v-else-if="usersToShow.length > 1"
      :max="3"
      size="xs">
      <UAvatar
        v-for="comment in usersToShow"
        :key="comment.id"
        :src="`https://gravatar.loli.net/avatar/${comment.expand?.user?.avatar}?s=64&r=G`"
        :alt="comment.expand?.user?.name" />
    </UAvatarGroup>

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
  postId: {
    type: String,
    required: true,
  },
});

const {
  data: commentsResponse,
  status,
  refresh,
} = await useLazyFetch<{
  message: string;
  data: {
    comments: CommentRecord[];
  };
}>(`/api/comments/records?filter=post="${props.postId}"&sort=-created`, {
  server: true,
  dedupe: "cancel",
});

const usersToShow = computed(() => {
  return commentsResponse.value?.data?.comments || [];
});

onActivated(() => {
  refresh();
});
</script>

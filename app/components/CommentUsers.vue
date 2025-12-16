<template>
  <div class="flex mt-2">
    <div
      v-if="status === 'pending'"
      class="flex items-center">
      <UIcon
        name="hugeicons:reload"
        class="size-6 text-muted animate-spin" />
    </div>

    <UAvatarGroup
      v-else-if="usersToShow.length > 0"
      :max="3"
      size="xs">
      <UAvatar
        v-for="comment in usersToShow"
        :key="comment.id"
        :src="`https://gravatar.loli.net/avatar/${comment.expand?.user?.avatar}?s=64&r=G`"
        :alt="comment.expand?.user?.name" />
    </UAvatarGroup>
  </div>
</template>

<script setup lang="ts">
import type { PocketBaseCommentRecord } from "~/types/auth.d";

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
    comments: PocketBaseCommentRecord[];
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

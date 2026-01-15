<template>
  <div>
    <ClientOnly>
      <UEmpty
        v-if="!loggedIn && allowComment"
        size="lg"
        title="参与评论需要登录"
        description="登录后即可在评论区发布你的观点与见解"
        :actions="[{ label: '立即登录', variant: 'soft', color: 'neutral', to: '/auth' }]"
        class="mt-8 select-none"
      />

      <CommentsForm
        v-if="loggedIn && allowComment"
        :post-id="postId"
        :raw-suggestions="commenters"
        :is-list-loading="isListLoading"
        @comment-created="onCommentSuccess"
        class="mt-8"
      />

      <CommentsList
        v-if="allowComment"
        ref="commentListRef"
        :post-id="postId"
        :allow-comment="allowComment"
        :user-id="currentUserId"
        @loading-change="(val) => (isListLoading = val)"
        @update-commenters="handleUpdateCommenters"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import type { CommentRecord } from '~/types/comments';

const props = defineProps<{
  postId: string;
  allowComment: boolean;
  mdcReady: boolean;
}>();

const { loggedIn, user: currentUser } = useUserSession();
const currentUserId = computed(() => currentUser.value?.id);

const isListLoading = ref(false);
const commentListRef = ref();
const commenters = ref<any[]>([]);

const handleUpdateCommenters = (uniqueUsers: CommentRecord[]) => {
  commenters.value = uniqueUsers.filter((u) => u.id !== currentUser.value?.id);
};

const onCommentSuccess = (newComment: any) => {
  if (commentListRef.value) commentListRef.value.handleCommentCreated(newComment);
};
</script>

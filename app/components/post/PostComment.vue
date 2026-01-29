<template>
  <div>
    <ClientOnly>
      <UEmpty
        v-if="!allowComment || !loggedIn"
        size="lg"
        variant="outline"
        :title="!allowComment ? '评论已关闭' : '参与评论需要登录'"
        :description="!allowComment ? '评论区暂停开放，感谢关注，敬请谅解！' : '登录后即可在评论区发布你的观点与见解'"
        :actions="
          allowComment && !loggedIn
            ? [
                {
                  label: '立即登录',
                  color: 'neutral',
                  ui: { base: 'px-5' },
                  to: '/auth',
                },
              ]
            : []
        "
        class="my-6 select-none"
      />

      <CommentsForm
        v-if="loggedIn && allowComment"
        :post-id="postId"
        :raw-suggestions="commenters"
        :is-list-loading="isListLoading"
        @comment-created="onCommentSuccess"
        class="my-6"
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
interface CommentListInstance {
  handleCommentCreated: (comment: any) => void;
}

const props = defineProps<{
  postId: string;
  allowComment: boolean;
}>();

const { loggedIn, user: currentUser } = useUserSession();
const currentUserId = computed(() => currentUser.value?.id);

const isListLoading = ref(false);
const commentListRef = ref<CommentListInstance | null>(null);
const commenters = ref<any[]>([]);

// 监听用户变化，当用户切换时清空评论者列表
watch(
  () => currentUser.value?.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      commenters.value = [];
    }
  },
);

const handleUpdateCommenters = (users: any[]) => {
  commenters.value = users.filter((u) => u.id !== currentUser.value?.id);
};

const onCommentSuccess = (newComment: any) => {
  if (commentListRef.value) commentListRef.value.handleCommentCreated(newComment);
};
</script>

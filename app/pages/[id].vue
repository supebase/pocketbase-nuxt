<template>
  <div>
    <div
      v-if="status === 'pending' && !postWithRelativeTime"
      key="loading"
      class="flex flex-col gap-6 mt-4"
    >
      <SkeletonPost class="opacity-70 mask-b-from-10" />
    </div>

    <div v-else-if="postWithRelativeTime" key="content">
      <div ref="authorRow" class="flex flex-col items-center justify-center gap-3 select-none">
        <PostsMeta
          :post-meta="postWithRelativeTime"
          :avatar-id="postWithRelativeTime.expand?.user?.avatar"
        />
      </div>

      <div class="relative mt-6 min-h-100">
        <div
          :class="[
            'transition-opacity duration-500',
            !mdcReady ? 'opacity-10 pointer-events-none' : 'opacity-100',
          ]"
        >
          <PostsToc :toc="toc" />
          <MDCRenderer
            v-if="ast"
            :key="postWithRelativeTime.id"
            :body="ast.body"
            :data="ast.data"
            class="prose prose-neutral prose-base dark:prose-invert max-w-none font-sans prose-p:text-justify prose-p:leading-7 wrap-break-word"
          />
        </div>
      </div>

      <div v-show="mdcReady">
        <ClientOnly>
          <UEmpty
            v-if="!loggedIn && postWithRelativeTime.allow_comment"
            size="lg"
            icon="i-hugeicons:chat-lock-01"
            title="参与评论需要登录"
            description="登录后即可在评论区发布你的观点与见解"
            :actions="[{ label: '立即登录', color: 'neutral', to: '/auth' }]"
            class="mt-8 select-none"
          />

          <CommentsForm
            v-if="loggedIn && postWithRelativeTime.allow_comment"
            :post-id="postWithRelativeTime.id"
            :raw-suggestions="commenters"
            :is-list-loading="isListLoading"
            @comment-created="onCommentSuccess"
            class="mt-8"
          />

          <CommentsList
            v-if="postWithRelativeTime.allow_comment"
            ref="commentListRef"
            :key="postWithRelativeTime?.id"
            :post-id="postWithRelativeTime.id"
            :allow-comment="postWithRelativeTime.allow_comment"
            :user-id="userId"
            @loading-change="(val) => (isListLoading = val)"
            @update-commenters="handleUpdateCommenters"
          />
        </ClientOnly>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core';

definePageMeta({
  hideHeaderBack: true,
});

const route = useRoute();
const { id } = route.params as { id: string };
const { loggedIn, user: currentUser } = useUserSession();
const { showHeaderBack } = useHeader();
const userId = computed(() => currentUser.value?.id);

const {
  postWithRelativeTime,
  status,
  error,
  refresh,
  mdcReady,
  ast,
  toc,
  updatedMarks,
  clearUpdateMark,
} = usePostLogic(id);

const isListLoading = ref(false);
const authorRow = ref<HTMLElement | null>(null);
const commentListRef = ref();
const commenters = ref<any[]>([]);

const handleUpdateCommenters = (uniqueUsers: any[]) => {
  commenters.value = uniqueUsers.filter((u) => u.id !== currentUser.value?.id);
};

const onCommentSuccess = (newComment: any) => {
  if (commentListRef.value) commentListRef.value.handleCommentCreated(newComment);
};

watch(loggedIn, () => {
  refresh();
});

// 错误处理
watch(
  error,
  (newErr) => {
    if (newErr) throw createError({ ...newErr });
  },
  { immediate: true },
);

// 滚动监听控制 Header
useIntersectionObserver(
  authorRow,
  (entries) => {
    const entry = entries[0];
    if (!entry) return;
    const { isIntersecting, boundingClientRect } = entry;
    if (isIntersecting) showHeaderBack.value = false;
    else if (boundingClientRect.top < 0 && mdcReady.value) showHeaderBack.value = true;
  },
  { threshold: 0 },
);

const checkHeaderVisibility = () => {
  if (!authorRow.value) return;
  const rect = authorRow.value.getBoundingClientRect();
  showHeaderBack.value = rect.top < 0 && mdcReady.value;
};

// KeepAlive 激活时检查是否有更新标记
onActivated(async () => {
  const currentId = (route.params as { id: string }).id;

  if (currentId && updatedMarks.value[currentId]) {
    // 直接后台静默刷新
    try {
      await refresh();
      clearUpdateMark(currentId);
      // 只有在数据刷新后，Notify 用户一下（可选）
      // toast.add({ title: '内容已同步最新版本', color: 'gray' })
    } catch (e) {
      console.error('静默刷新失败', e);
    }
  }

  nextTick(() => {
    checkHeaderVisibility();
  });
});

// 清理 UI 状态
onBeforeRouteLeave(() => {
  showHeaderBack.value = false;
});

onUnmounted(() => {
  showHeaderBack.value = false;
});
</script>

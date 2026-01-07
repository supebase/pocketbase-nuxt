<template>
  <div class="container mx-auto px-4 md:px-0">
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

      <div class="relative mt-6 min-h-75">
        <div
          v-if="!mdcReady"
          class="absolute inset-0 h-40 flex flex-col items-center justify-center z-10 select-none pointer-events-none"
        >
          <UIcon name="i-hugeicons:refresh" class="size-6 mb-2 animate-spin text-muted" />
          <span class="text-sm font-medium text-muted tracking-widest text-center">
            {{ isUpdateRefresh ? '同步内容中...' : '加载内容中...' }}
          </span>
        </div>

        <div
          :class="[
            'transition-all duration-500 ease-out',
            mdcReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
          ]"
        >
          <PostsToc :toc="toc" />
          <MDCRenderer
            v-if="ast"
            :key="postWithRelativeTime.updated"
            :body="ast.body"
            :data="ast.data"
            class="prose prose-neutral prose-base dark:prose-invert max-w-none font-sans prose-p:text-justify prose-p:leading-7 wrap-break-word"
          />
        </div>
      </div>

      <div
        :class="[
          'transition-all duration-700 delay-300',
          mdcReady ? 'opacity-100' : 'opacity-0 pointer-events-none',
        ]"
      >
        <UAlert
          v-if="!postWithRelativeTime.allow_comment"
          icon="i-hugeicons:comment-block-02"
          color="neutral"
          variant="outline"
          title="评论功能已关闭"
          class="mt-8 select-none"
        />

        <UEmpty
          v-if="!loggedIn && postWithRelativeTime.allow_comment"
          size="lg"
          icon="i-hugeicons:chat-lock-01"
          title="登录后参与讨论"
          :actions="[{ label: '立即登录', color: 'neutral', to: '/auth' }]"
          class="mt-8 select-none"
        />

        <ClientOnly>
          <CommentsForm
            v-if="loggedIn && postWithRelativeTime.allow_comment"
            :post-id="postWithRelativeTime.id"
            :raw-suggestions="commenters"
            :is-list-loading="isListLoading"
            @comment-created="onCommentSuccess"
            class="mt-8"
          />
        </ClientOnly>

        <CommentsList
          ref="commentListRef"
          :key="postWithRelativeTime?.id"
          :post-id="postWithRelativeTime.id"
          :allow-comment="postWithRelativeTime.allow_comment"
          :user-id="userId"
          @loading-change="(val) => (isListLoading = val)"
          @update-commenters="handleUpdateCommenters"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core';

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
  isUpdateRefresh,
  parseContent,
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

// 监听内容变化进行 MDC 解析
watch(
  [() => postWithRelativeTime.value?.content, status],
  async ([newContent, newStatus]) => {
    if (newStatus === 'pending' && !isUpdateRefresh.value) {
      mdcReady.value = false;
      return;
    }
    if ((newStatus === 'success' || newStatus === 'idle') && newContent) {
      await parseContent(newContent);
    }
  },
  { immediate: true },
);

// 错误处理
watch(
  error,
  (newErr) => {
    if (newErr) throw createError({ ...newErr, fatal: true });
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

// KeepAlive 激活时检查是否有更新标记
onActivated(async () => {
  const currentId = Array.isArray(id) ? id[0] : id;
  if (updatedMarks.value[currentId]) {
    isUpdateRefresh.value = true;
    await refresh();
    clearUpdateMark(currentId);
  }
});

// 清理 UI 状态
onBeforeRouteLeave(() => {
  showHeaderBack.value = false;
});

onUnmounted(() => {
  showHeaderBack.value = false;
});
</script>

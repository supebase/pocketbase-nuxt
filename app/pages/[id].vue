<template>
  <div class="container mx-auto">
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
          <span class="text-sm font-medium text-muted tracking-widest">
            {{ isUpdateRefresh ? '正在同步内容改动' : '沉浸式梳理内容' }}
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
          :ui="{
            root: 'items-center justify-center text-dimmed',
            wrapper: 'flex-none',
          }"
          icon="i-hugeicons:comment-block-02"
          color="neutral"
          variant="outline"
          title="本内容评论互动功能已关闭"
          class="mt-8 select-none"
        />

        <UEmpty
          v-if="!loggedIn && postWithRelativeTime.allow_comment"
          size="lg"
          icon="i-hugeicons:chat-lock-01"
          title="参与评论需要登录"
          description="登录后即可在评论区发布你的观点与见解"
          :actions="[
            {
              label: '立即登录',
              color: 'neutral',
              variant: 'solid',
              to: '/auth',
            },
          ]"
          class="mt-8 select-none tracking-wide"
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

// --- 1. 基础状态与路由 ---
const route = useRoute();
const { id } = route.params as { id: string };
const { loggedIn, user: currentUser } = useUserSession();
const { showHeaderBack } = useHeader();
const userId = computed(() => currentUser.value?.id);

// --- 2. 引入拆分后的逻辑 ---
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
} = await usePostLogic(id);

// --- 3. 页面特有 UI 交互状态 ---
const isListLoading = ref(false);
const authorRow = ref<HTMLElement | null>(null);
const commentListRef = ref();
const commenters = ref<any[]>([]);

// --- 4. 逻辑处理函数 (保留原样) ---
const handleUpdateCommenters = (uniqueUsers: any[]) => {
  commenters.value = uniqueUsers.filter((u) => u.id !== currentUser.value?.id);
};
const onCommentSuccess = (newComment: any) => {
  if (commentListRef.value) commentListRef.value.handleCommentCreated(newComment);
};

// --- 5. 核心 Watch 监听 (保留原样) ---
watch(
  [() => postWithRelativeTime.value?.content, status],
  async ([newContent, newStatus]) => {
    if (newStatus === 'pending' && !isUpdateRefresh.value) {
      mdcReady.value = false;
      ast.value = null;
      return;
    }
    if ((newStatus === 'success' || newStatus === 'idle') && newContent) {
      if (ast.value && mdcReady.value && !isUpdateRefresh.value) return;
      await parseContent(newContent);
    }
  },
  { immediate: true },
);

watch(loggedIn, (isLogged) => {
  if (isLogged && commentListRef.value?.comments) {
    handleUpdateCommenters(commentListRef.value.getUniqueUsers(commentListRef.value.comments));
  }
});

watch(
  error,
  (newErr) => {
    if (newErr) throw createError({ ...newErr, fatal: true });
  },
  { immediate: true },
);

// --- 6. 生命周期 ---
onMounted(() => {
  if (ast.value && !mdcReady.value) mdcReady.value = true;
});

useIntersectionObserver(
  authorRow,
  (entries) => {
    const entry = entries[0];
    if (!entry) return;
    const { isIntersecting, boundingClientRect } = entry;
    if (isIntersecting) showHeaderBack.value = false;
    else if (boundingClientRect.top < 0 && mdcReady.value) showHeaderBack.value = true;
  },
  { threshold: 0, rootMargin: '-20px 0px 0px 0px' },
);

onActivated(async () => {
  const currentId = id;
  if (updatedMarks.value[currentId]) {
    isUpdateRefresh.value = true;
    mdcReady.value = false;
    await refresh();
    clearUpdateMark(currentId);
  }
});

onBeforeRouteLeave(() => {
  showHeaderBack.value = false;
});
onUnmounted(() => {
  showHeaderBack.value = false;
});
</script>

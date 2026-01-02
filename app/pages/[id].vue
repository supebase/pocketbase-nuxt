<template>
  <div class="container mx-auto">
    <UAlert v-if="error" :description="error.data?.message || '获取内容失败，请稍后重试'" variant="soft"
      icon="i-hugeicons:alert-02" color="error" class="mb-4" />

    <div v-if="status === 'pending' && !postWithRelativeTime" key="loading"
      class="flex flex-col gap-6 mt-4">
      <SkeletonPost class="opacity-70 mask-b-from-10" />
    </div>

    <div v-else-if="postWithRelativeTime" key="content">
      <div ref="authorRow" class="flex flex-col items-center justify-center gap-3 select-none">
        <PostsMeta :post-meta="postWithRelativeTime"
          :avatar-id="postWithRelativeTime.expand?.user?.avatar" />
      </div>

      <div class="relative mt-6 min-h-75">
        <div v-if="!mdcReady"
          class="absolute inset-0 h-40 flex flex-col items-center justify-center z-10 select-none pointer-events-none">
          <UIcon name="i-hugeicons:refresh" class="size-6 mb-2 animate-spin text-muted" />
          <span class="text-sm font-medium text-muted tracking-widest">
            {{ isUpdateRefresh ? '正在同步内容改动' : '沉浸式梳理内容' }}
          </span>
        </div>

        <div :class="[
          'transition-all duration-500 ease-out',
          mdcReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
        ]">
          <PostsToc :toc="toc" />
          <MDCRenderer v-if="ast" :key="postWithRelativeTime.updated" :body="ast.body"
            :data="ast.data"
            class="prose prose-neutral prose-base dark:prose-invert prose-img:rounded-xl prose-img:ring-1 prose-img:ring-neutral-200 prose-img:dark:ring-neutral-800" />
        </div>
      </div>

      <div :class="[
        'transition-all duration-700 delay-300',
        mdcReady ? 'opacity-100' : 'opacity-0 pointer-events-none',
      ]">
        <UAlert v-if="!postWithRelativeTime.allow_comment"
          :ui="{ root: 'items-center justify-center text-dimmed', wrapper: 'flex-none' }"
          icon="i-hugeicons:comment-block-02" color="neutral" variant="soft" title="本内容评论互动功能已关闭"
          class="mt-8 select-none" />

        <UEmpty v-if="!loggedIn && postWithRelativeTime.allow_comment" size="lg"
          icon="i-hugeicons:chat-lock-01" title="参与评论需要登录" description="登录后即可在评论区发布你的观点与见解"
          :actions="[{ label: '立即登录', color: 'neutral', variant: 'solid', to: '/auth' }]"
          class="mt-8 select-none" />

        <ClientOnly>
          <CommentsForm v-if="loggedIn && postWithRelativeTime.allow_comment"
            :post-id="postWithRelativeTime.id" :raw-suggestions="commenters"
            :is-list-loading="isListLoading" @comment-created="onCommentSuccess" class="mt-8" />
        </ClientOnly>

        <CommentsList ref="commentListRef" :key="postWithRelativeTime?.id"
          :post-id="postWithRelativeTime.id" :allow-comment="postWithRelativeTime.allow_comment"
          :user-id="userId" @loading-change="(val) => (isListLoading = val)"
          @update-commenters="handleUpdateCommenters" />
      </div>
    </div>

    <div v-else key="empty" class="flex flex-col items-center justify-center py-20 select-none">
      <UEmpty variant="naked" title="内容无法找到" description="当前访问的内容可能已被删除，返回首页浏览更多"
        :actions="[{ label: '返回首页', color: 'neutral', to: '/' }]" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SinglePostResponse } from '~/types/posts';
import { useIntersectionObserver } from '@vueuse/core';
import { parseMarkdown } from '@nuxtjs/mdc/runtime';

// --- 1. 状态管理 ---
const { updatedMarks, clearUpdateMark } = usePostUpdateTracker();
const { loggedIn, user: currentUser } = useUserSession();
const userId = computed(() => currentUser.value?.id);
const { showHeaderBack } = useHeader();
const route = useRoute();
const { id } = route.params as { id: string };

definePageMeta({
  validate: (route) => {
    const params = route.params as { id?: string };
    const targetId = params.id;
    if (!targetId) return false;
    return /^[a-z0-9]{15}$/i.test(targetId);
  },
});

const isListLoading = ref(false);
const isUpdateRefresh = ref(false);
const authorRow = ref<HTMLElement | null>(null);
const commentListRef = ref();
const commenters = ref<any[]>([]);

// --- 2. 数据获取 ---
const { data, status, refresh, error } = await useLazyFetch<SinglePostResponse>(
  `/api/collections/post/${id}`,
  {
    key: `post-detail-${id}`,
    server: true,
    query: { userId },
    watch: [() => id],
  }
);

// --- 3. 核心状态 ---
const mdcReady = ref(false);
const ast = ref<any>(null);
const toc = ref<any>(null);

// --- 4. 计算属性 ---
const postWithRelativeTime = computed(() => {
  const postData = data.value?.data;
  if (!postData) return null;
  return {
    ...postData,
    relativeTime: useRelativeTime(postData.created),
  };
});

// --- 5. 逻辑处理 ---
const handleUpdateCommenters = (uniqueUsers: any[]) => {
  commenters.value = uniqueUsers.filter((u) => u.id !== currentUser.value?.id);
};

const onCommentSuccess = (newComment: any) => {
  if (commentListRef.value) {
    commentListRef.value.handleCommentCreated(newComment);
  }
};

// 核心解析函数
const parseContent = async (content: string) => {
  if (!content) {
    mdcReady.value = true;
    return;
  }

  // 💡 逃生通道：3秒保底强制显示
  const fallback = setTimeout(() => {
    if (!mdcReady.value) {
      console.warn('MDC Fallback triggered');
      mdcReady.value = true;
    }
  }, 3000);

  try {
    const result = await parseMarkdown(content, {
      toc: { depth: 4, searchDepth: 4 },
    });
    ast.value = result;
    toc.value = result.toc;

    if (import.meta.client) {
      nextTick(() => {
        setTimeout(() => {
          mdcReady.value = true;
          isUpdateRefresh.value = false;
          clearTimeout(fallback); // 正常完成则清除保底
        }, 100);
      });
    } else {
      mdcReady.value = true;
    }
  } catch (e) {
    console.error('MDC Parsing Error:', e);
    mdcReady.value = true;
    clearTimeout(fallback);
  }
};

// --- 6. 核心监听逻辑 ---
// 合并了之前的多个监听器，统一管理数据流
watch(
  [() => postWithRelativeTime.value?.content, status],
  async ([newContent, newStatus]) => {
    // 1. 开始加载新内容时（非刷新模式），重置状态
    if (newStatus === 'pending' && !isUpdateRefresh.value) {
      mdcReady.value = false;
      ast.value = null;
      return;
    }

    // 2. 数据到达时，触发解析
    if ((newStatus === 'success' || newStatus === 'idle') && newContent) {
      // 避免重复解析相同内容
      if (ast.value && mdcReady.value && !isUpdateRefresh.value) return;
      await parseContent(newContent);
    }
  },
  { immediate: true }
);

watch(loggedIn, (isLogged) => {
  if (isLogged && commentListRef.value?.comments) {
    handleUpdateCommenters(commentListRef.value.getUniqueUsers(commentListRef.value.comments));
  }
});

// --- 7. 生命周期与交互 ---
onMounted(() => {
  // 水合保底：如果已有 AST 但没开启 UI，开启它
  if (ast.value && !mdcReady.value) {
    mdcReady.value = true;
  }
});

useIntersectionObserver(
  authorRow,
  (entries) => {
    const entry = entries[0];
    if (!entry) return;
    const { isIntersecting, boundingClientRect } = entry;
    if (isIntersecting) {
      showHeaderBack.value = false;
    } else if (boundingClientRect.top < 0 && mdcReady.value) {
      showHeaderBack.value = true;
    }
  },
  { threshold: 0, rootMargin: '-20px 0px 0px 0px' }
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

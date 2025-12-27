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
        <div class="flex items-center justify-between gap-2 w-full">
          <div class="flex items-center gap-3">
            <UIcon v-if="postWithRelativeTime.icon" :name="postWithRelativeTime.icon"
              class="size-7 text-primary" />
            <div v-else class="size-8">
              <CommonGravatar :avatar-id="postWithRelativeTime.expand?.user?.avatar" :size="64" />
            </div>
            <div class="text-dimmed flex items-center">
              <ClientOnly>
                {{ postWithRelativeTime.relativeTime }}
                <template #fallback><span>{{ useRelativeTime(postWithRelativeTime.created).value
                }}</span></template>
              </ClientOnly>
              <span class="mx-1.5">&bull;</span>
              {{ useReadingTime(postWithRelativeTime.content) }}
            </div>
          </div>

          <div>
            <UIcon name="i-hugeicons:arrow-turn-backward"
              class="size-6.5 text-dimmed cursor-pointer hover:text-primary transition-colors"
              @click="$router.back()" />
          </div>
        </div>
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
            :data="ast.data" @vue:mounted="handleMdcMounted"
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

        <CommentsList ref="commentListRef" :post-id="postWithRelativeTime.id"
          :allow-comment="postWithRelativeTime.allow_comment"
          @loading-change="(val) => (isListLoading = val)"
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
import type { SinglePostResponse } from "~/types/posts";
import { useIntersectionObserver } from "@vueuse/core";
import { parseMarkdown } from "@nuxtjs/mdc/runtime";

// --- 1. 状态管理 ---
const { updatedMarks, clearUpdateMark } = usePostUpdateTracker();
const { loggedIn, user: currentUser } = useUserSession();
const { showHeaderBack } = useHeader();
const route = useRoute();
const { id } = route.params as { id: string };

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
    server: true
  }
);

// --- 3. 核心修复点：初始化 mdcReady ---
const mdcReady = ref(false);
const ast = ref<any>(null); // 存储解析后的 AST
const toc = ref<any>(null);

// --- 4. 计算属性 ---
const postWithRelativeTime = computed(() => {
  const postData = data.value?.data;
  if (!postData) return null;
  return {
    ...postData,
    relativeTime: useRelativeTime(postData.created).value,
  };
});

// --- 5. 逻辑处理 ---
const handleUpdateCommenters = (rawComments: any[]) => {
  // 如果没有评论，确保清空列表
  if (!rawComments || rawComments.length === 0) {
    commenters.value = [];
    return;
  }

  const userMap = new Map();
  const currentUserId = currentUser.value?.id;

  rawComments.forEach((comment) => {
    // 兼容多种数据结构：有些可能是原始 record，有些可能是已经 expand 的
    const u = comment.expand?.user || comment.user;
    if (u?.id && u.id !== currentUserId) {
      userMap.set(u.id, {
        id: u.id,
        name: u.name,
        avatar: u.avatar || u.avatarId // 兼容字段名
      });
    }
  });

  commenters.value = Array.from(userMap.values());
};

const onCommentSuccess = (newComment: any) => {
  if (commentListRef.value) {
    commentListRef.value.handleCommentCreated(newComment);
  }
  refreshNuxtData(`comments-data-${id}`);
};

watch(currentUser, () => {
  if (commentListRef.value?.comments) {
    handleUpdateCommenters(commentListRef.value.comments);
  }
}, { deep: true });

// 创建一个解析函数
const parseContent = async (content: string) => {
  if (!content) return;
  try {
    // 将 markdown 字符串解析为 AST
    const result = await parseMarkdown(content, {
      toc: {
        depth: 4,
        searchDepth: 4,
      }
    });
    ast.value = result; // MDCRenderer 绑定的是 body
    toc.value = result.toc;  // 提取目录结构
  } catch (e) {
    console.error('MDC Parsing Error:', e);
  }
};

// 监听内容解析
watch(() => postWithRelativeTime.value?.content, async (newContent) => {
  if (!newContent) return;

  // 关键：开始解析前，如果不是 SSR，可以把 mdcReady 设为 false 开启淡入效果
  if (import.meta.client && !isUpdateRefresh.value) {
    // mdcReady.value = false; // 如果你希望每次换内容都闪现一下动画，取消注释
  }

  await parseContent(newContent);

  // 如果解析完后 AST 没变（例如内容一致），handleMdcMounted 可能不触发
  // 这里做一个保底
  if (import.meta.server) {
    mdcReady.value = true;
  }
}, { immediate: true });

const handleMdcMounted = () => {
  // 使用 nextTick 确保渲染树已更新
  nextTick(() => {
    setTimeout(() => {
      mdcReady.value = true;
      isUpdateRefresh.value = false;
    }, 100); // 稍微给一点点缓冲，防止闪烁
  });
};

// --- 6. 生命周期与交互 ---
onMounted(() => {
  // 确保客户端激活后，如果已有数据，一定要显示内容
  if (postWithRelativeTime.value) {
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
  { threshold: 0, rootMargin: "-20px 0px 0px 0px" }
);

onActivated(async () => {
  const currentId = id;
  if (updatedMarks.value[currentId]) {
    isUpdateRefresh.value = true;
    mdcReady.value = false; // 标记加载态进行平滑同步
    await refresh();
    if (commentListRef.value) {
      commentListRef.value.fetchComments(true);
    }
    clearUpdateMark(currentId);
  }
});

onBeforeRouteLeave(() => { showHeaderBack.value = false; });

onUnmounted(() => {
  showHeaderBack.value = false;
});

// --- 7. 侦听器 ---
watch(() => data.value?.data?.updated, (newVal, oldVal) => {
  if (oldVal && newVal !== oldVal) {
    mdcReady.value = false;
  }
});

// 修正 status 监听
watch(status, (newStatus) => {
  if (newStatus === 'pending') {
    // 只有在非静默刷新（如路由跳转）时才彻底重置
    if (!isUpdateRefresh.value) {
      mdcReady.value = false;
      ast.value = null; // 清空旧内容防止残留
    }
  }
});

watch(() => id, () => {
  mdcReady.value = false;
  commenters.value = [];
});
</script>
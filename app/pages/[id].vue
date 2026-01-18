<template>
  <div class="post-page-wrapper">
    <div v-if="shouldShowSkeleton" class="flex flex-col gap-6 mt-4">
      <SkeletonPost class="mask-b-from-10" />
    </div>

    <div v-if="postWithRelativeTime && !shouldShowSkeleton" :class="contentClass">
      <PostHeader :post="postWithRelativeTime" :mdc-ready="mdcReady" />

      <PostContent :post-id="postWithRelativeTime.id" :mdc-ready="mdcReady" :toc="toc" :ast="ast" />

      <div v-if="mdcReady" :class="['comment-section', commentsVisible ? 'opacity-100' : 'opacity-0']">
        <div ref="commentTrigger" class="h-1" />

        <Transition name="fade">
          <CommonReactions v-if="commentsVisible" :post-id="postWithRelativeTime.id" />
        </Transition>

        <Transition name="fade">
          <PostComment
            v-if="commentsVisible"
            :post-id="postWithRelativeTime.id"
            :allow-comment="postWithRelativeTime.allow_comment"
            :mdc-ready="mdcReady"
          />
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useIntersectionObserver, useTimeout } from '@vueuse/core';

const route = useRoute();
const { id } = route.params as { id: string };
const { loggedIn } = useUserSession();

definePageMeta({
  hideHeaderBack: false,
});

const { postWithRelativeTime, status, error, refresh, mdcReady, ast, toc, updatedMarks, clearUpdateMark } =
  usePostLogic(id);

const isLongLoading = useTimeout(200);
const shouldShowSkeleton = computed(() => {
  return status.value === 'pending' && isLongLoading.value && !postWithRelativeTime.value;
});

const commentTrigger = ref<HTMLElement | null>(null);
const commentsVisible = ref(false);

const { stop } = useIntersectionObserver(
  commentTrigger,
  ([entry]) => {
    if (entry?.isIntersecting && mdcReady.value) {
      commentsVisible.value = true;
      stop();
    }
  },
  { rootMargin: '100px' },
);

const isFirstMount = ref(true);
const hasAnimated = ref(false);
const isAnimating = ref(false);

watch(
  [() => postWithRelativeTime.value, shouldShowSkeleton],
  ([newPost, showSkeleton]) => {
    // 只有当：有了数据，且骨架屏不需要显示（或已经结束显示）时，才开始内容滑入
    if (newPost && !showSkeleton && !hasAnimated.value) {
      isAnimating.value = true;
      hasAnimated.value = true;
    }
  },
  { immediate: true },
);

watch(isAnimating, (val) => {
  if (val) {
    setTimeout(() => {
      isAnimating.value = false;
    }, 1000); // 时间略大于你的 CSS 动画时长
  }
});

const contentClass = computed(() => {
  return {
    // 只有在第一次触发动画且 isAnimating 为 true 时才挂载动画类
    'slide-up-content': isAnimating.value,

    // 核心修改：
    // 如果没有数据，且从未播放过动画，则隐藏（防止闪烁）
    // 一旦 hasAnimated 变成 true，就不再挂载 opacity-0
    'opacity-0': !postWithRelativeTime.value && !hasAnimated.value,
  };
});

watch(mdcReady, async (ready) => {
  if (ready) {
    // 增加延迟，确保 MDCRenderer 已经完成了初步的 DOM 插入和样式计算
    await nextTick();
    // 强制等待 400ms，这通常是 Markdown 渲染 + 内容淡入的时间
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (!commentsVisible.value && commentTrigger.value) {
      const rect = commentTrigger.value.getBoundingClientRect();
      // 如果此时已经在视口了，说明是短文章，展示评论
      if (rect.top < window.innerHeight + 200) {
        commentsVisible.value = true;
        stop();
      }
    }
  }
});

// 错误处理
watch(
  error,
  (newErr) => {
    if (newErr) throw createError({ ...newErr });
  },
  { immediate: true },
);

// 登录状态切换时刷新数据
watch(loggedIn, () => refresh());

onActivated(async () => {
  if (id && updatedMarks.value[id]) {
    try {
      await refresh();
      clearUpdateMark(id);
    } catch (e) {
      console.error('静默刷新失败', e);
    }
  }
});

onDeactivated(() => {
  isFirstMount.value = false;
});
</script>

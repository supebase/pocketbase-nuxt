<template>
  <div class="post-page-wrapper">
    <Transition name="fade">
      <div v-if="shouldShowSkeleton" class="flex flex-col gap-6 mt-4">
        <SkeletonPost class="mask-b-from-10" />
      </div>
    </Transition>

    <div v-if="postWithRelativeTime && mdcReady" :class="contentClass">
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

const isFullyReady = computed(() => {
  return !!postWithRelativeTime.value && mdcReady.value;
});

const shouldShowSkeleton = computed(() => {
  const loading = status.value === 'pending' || !mdcReady.value;
  return loading && isLongLoading.value && !hasAnimated.value;
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

const hasAnimated = ref(false);
const isAnimating = ref(false);

watch(
  isFullyReady,
  (ready) => {
    // 只有第一次 ready 时触发动画锁
    if (ready && !hasAnimated.value) {
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

const contentClass = computed(() => ({
  'slide-up-content': isAnimating.value,
  'opacity-0': !isFullyReady.value && !hasAnimated.value,
}));

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
</script>

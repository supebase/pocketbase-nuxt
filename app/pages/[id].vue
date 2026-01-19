<template>
  <div class="post-page-wrapper">
    <Transition name="fade">
      <div v-if="status === 'pending' && !postWithRelativeTime && isLongLoading" class="flex flex-col gap-6 mt-4">
        <SkeletonPost class="mask-b-from-10" />
      </div>
    </Transition>

    <ClientOnly>
      <div v-if="postWithRelativeTime && ast" :class="contentClass">
        <PostHeader :post="postWithRelativeTime" />

        <Suspense @resolve="onMdcFinished">
          <template #default>
            <PostContent :post-id="postWithRelativeTime.id" :toc="toc" :ast="ast" />
          </template>
          <template #fallback>
            <SkeletonMDC class="mask-b-from-10" />
          </template>
        </Suspense>

        <div
          ref="commentTrigger"
          class="comment-wrapper transition-all duration-700 ease-in-out"
          :class="[commentsVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0']"
        >
          <div class="h-1" />
          <CommonReactions v-if="commentsVisible" :post-id="postWithRelativeTime.id" />
          <PostComment
            v-if="commentsVisible"
            :post-id="postWithRelativeTime.id"
            :allow-comment="postWithRelativeTime.allow_comment"
          />
        </div>
      </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { useIntersectionObserver, useTimeout } from '@vueuse/core';

const route = useRoute();
const { id } = route.params as { id: string };
const { loggedIn } = useUserSession();

definePageMeta({ hideHeaderBack: false });

const { postWithRelativeTime, status, error, refresh, ast, toc, updatedMarks, clearUpdateMark } = usePostLogic(id);
const isLongLoading = useTimeout(200);

// 动画相关状态
const hasAnimated = ref(false);
const isAnimating = ref(false);

// 只有 API 成功拿到了数据，就开始外壳的滑入动画
watch(
  () => postWithRelativeTime.value,
  (val) => {
    if (val && !hasAnimated.value) {
      isAnimating.value = true;
      hasAnimated.value = true;
    }
  },
  { immediate: true },
);

// 动画结束后清理类名
watch(isAnimating, (val) => {
  if (val)
    setTimeout(() => {
      isAnimating.value = false;
    }, 1000);
});

const contentClass = computed(() => ({
  'slide-up-content': isAnimating.value,
  'opacity-0': !postWithRelativeTime.value && !hasAnimated.value,
}));

// 评论区逻辑
const commentTrigger = ref<HTMLElement | null>(null);
const commentsVisible = ref(false);
const mdcFinished = ref(false);

const { stop } = useIntersectionObserver(
  commentTrigger,
  ([entry]) => {
    if (entry?.isIntersecting && mdcFinished.value) {
      commentsVisible.value = true;
      stop();
    }
  },
  { rootMargin: '100px' },
);

// 当 Suspense 内部渲染彻底完成
const onMdcFinished = async () => {
  mdcFinished.value = true;
  await nextTick();
  // 如果是短文章，自动展开评论
  if (commentTrigger.value) {
    const rect = commentTrigger.value.getBoundingClientRect();
    if (rect.top < window.innerHeight + 400) {
      commentsVisible.value = true;
      stop();
    }
  }
};

const contentReady = computed(() => status.value === 'success' && !!ast.value);

watch(
  error,
  (err) => {
    if (err) throw createError({ ...err });
  },
  { immediate: true },
);
watch(loggedIn, () => refresh());

onActivated(async () => {
  if (id && updatedMarks.value[id]) {
    await refresh();
    clearUpdateMark(id);
  }
});
</script>

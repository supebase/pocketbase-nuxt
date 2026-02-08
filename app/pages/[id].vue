<template>
  <div>
    <div v-if="postWithRelativeTime">
      <PostHeader :post="postWithRelativeTime" />

      <PostContent :post-id="postWithRelativeTime.id" :toc="toc" :ast="ast" @rendered="onMdcFinished" />

      <div
        ref="commentTrigger"
        class="comment-wrapper transition-all duration-700 ease-in-out"
        :class="[commentsVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0']"
      >
        <div class="h-1" />

        <CommonPoll v-if="commentsVisible && postWithRelativeTime.poll" :room="postWithRelativeTime.id" />
        <CommonReactions v-if="commentsVisible && postWithRelativeTime.reactions" :post-id="postWithRelativeTime.id" />

        <PostComment
          v-if="commentsVisible"
          :post-id="postWithRelativeTime.id"
          :allow-comment="postWithRelativeTime.allow_comment"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useIntersectionObserver, useTimeout } from '@vueuse/core';

const route = useRoute();
const { id } = route.params as { id: string };
const { loggedIn } = useUserSession();

definePageMeta({ hideHeaderBack: false });

const { postWithRelativeTime, status, error, refresh, ast, toc, updatedMarks, clearUpdateMark } = usePostLogic(id);

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
  { rootMargin: '200px' },
);

// 当 Suspense 内部渲染彻底完成
const onMdcFinished = async () => {
  mdcFinished.value = true;
  await nextTick();

  if (commentTrigger.value) {
    const rect = commentTrigger.value.getBoundingClientRect();
    if (rect.top < window.innerHeight + 400) {
      commentsVisible.value = true;
      stop();
    }
  }
};

watch(
  error,
  (err) => {
    if (err) {
      navigateTo('/', { replace: true });
    }
  },
  { immediate: true },
);

if (import.meta.client) {
  watch(loggedIn, (val) => {
    refresh();
  });
}

onActivated(async () => {
  if (id && updatedMarks.value[id]) {
    await refresh();
    clearUpdateMark(id);
  }
});
</script>

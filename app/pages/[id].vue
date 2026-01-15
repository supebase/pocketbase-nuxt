<template>
  <div>
    <div v-if="shouldShowSkeleton" key="loading" class="flex flex-col gap-6 mt-4">
      <SkeletonPost class="mask-b-from-10" />
    </div>

    <div v-else-if="postWithRelativeTime" key="content">
      <PostHeader :post="postWithRelativeTime" :mdc-ready="mdcReady" />

      <PostContent
        :post-id="postWithRelativeTime.id"
        :mdc-ready="mdcReady"
        :toc="toc"
        :ast="ast"
        :class="{ 'record-item-animate': isFirstTimeRender && !shouldShowSkeleton }"
        :style="{ '--delay': `.15s` }"
      />

      <div v-if="mdcReady" ref="commentTrigger" />

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
</template>

<script setup lang="ts">
import { useIntersectionObserver, useTimeout, useTimeoutFn } from '@vueuse/core';

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

const isFirstTimeRender = ref(true);
useTimeoutFn(() => {
  isFirstTimeRender.value = false;
}, 1000);

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

watch(mdcReady, async (ready) => {
  if (ready && !commentsVisible.value) {
    // 等待内容真正渲染到 DOM 产生高度
    await nextTick();

    if (commentTrigger.value) {
      const rect = commentTrigger.value.getBoundingClientRect();
      // 如果渲染完后，触发器已经在视口内（短文章），则加载评论
      if (rect.top < window.innerHeight + 100) {
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

<style scoped>
.fade-enter-active {
  transition: opacity 0.6s ease-out;
}
.fade-enter-from {
  opacity: 0;
}
</style>

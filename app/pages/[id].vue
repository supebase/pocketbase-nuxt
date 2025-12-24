<template>
  <div class="container mx-auto">
    <UAlert v-if="error" :description="error.data?.message || '获取内容失败，请稍后重试'" variant="soft"
      icon="i-hugeicons:alert-02" color="error" class="mb-4" />

    <Transition name="fade" mode="out-in">
      <div v-if="status === 'pending' && !postWithRelativeTime" key="loading"
        class="flex flex-col gap-6 mt-4">
        <SkeletonPost />
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
              <div class="text-dimmed">
                <ClientOnly>
                  {{ postWithRelativeTime.relativeTime }}
                  <template #fallback><span>刚刚</span></template>
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

        <div class="relative mt-6">
          <Transition leave-active-class="transition duration-300 opacity-0">
            <div v-if="!mdcReady"
              class="absolute inset-0 h-40 flex items-center justify-center z-10 select-none pointer-events-none">
              <UIcon name="i-hugeicons:refresh" class="size-5 mr-2 animate-spin text-muted" />
              <span class="font-medium text-muted">
                {{ isUpdateRefresh ? '正在同步内容改动' : '沉浸式梳理内容' }}
              </span>
            </div>
          </Transition>

          <div :class="[
            'transition-all duration-300 ease-out',
            mdcReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none',
          ]">
            <MDC :key="postWithRelativeTime.id + postWithRelativeTime.updated"
              :value="postWithRelativeTime.content || ''" @vue:mounted="handleMdcMounted"
              class="prose prose-neutral prose-lg sm:prose-[18px] dark:prose-invert prose-img:rounded-xl prose-img:ring-1 prose-img:ring-neutral-200 prose-img:dark:ring-neutral-800" />
          </div>
        </div>

        <div :class="[
          'transition-all duration-700 delay-300',
          mdcReady ? 'opacity-100' : 'opacity-0 pointer-events-none',
        ]">
          <UAlert :ui="{ root: 'items-center justify-center text-dimmed', wrapper: 'flex-none' }" v-if="!postWithRelativeTime.allow_comment" icon="i-hugeicons:comment-block-02"
            color="neutral" variant="outline" title="本内容评论互动功能已关闭" class="mt-8 select-none" />

          <ClientOnly>
            <CommentsCommentForm
              v-if="loggedIn && !isListLoading && postWithRelativeTime.allow_comment"
              :post-id="postWithRelativeTime.id" :raw-suggestions="commenters"
              @comment-created="onCommentSuccess" class="mt-8" />
          </ClientOnly>

          <CommentsCommentList ref="commentListRef" :post-id="postWithRelativeTime.id"
            :allow-comment="postWithRelativeTime.allow_comment"
            @loading-change="(val) => (isListLoading = val)"
            @update-commenters="handleUpdateCommenters" />
        </div>
      </div>

      <div v-else key="empty" class="flex flex-col items-center justify-center py-20 select-none">
        <UEmpty variant="naked" title="内容无法找到" description="当前访问的内容可能已被删除，返回首页浏览更多" :actions="[
          { label: '返回首页', color: 'neutral', to: '/' },
        ]" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { SinglePostResponse } from "~/types/posts";
import { useIntersectionObserver } from "@vueuse/core";

const { updatedPostIds, clearUpdateMark } = usePostUpdateTracker();
const { loggedIn, user: currentUser } = useUserSession();
const route = useRoute();
const { id } = route.params;

const isListLoading = ref(false);
const mdcReady = ref(false);
const commentListRef = ref();
const commenters = ref<any[]>([]);
const isUpdateRefresh = ref(false);
const authorRow = ref<HTMLElement | null>(null);

const { data, status, refresh, error } = await useLazyFetch<SinglePostResponse>(
  `/api/collections/post/${id}`,
  { server: true }
);

const postWithRelativeTime = computed(() => {
  const postData = data.value?.data;
  if (!postData) return null;
  return {
    ...postData,
    relativeTime: useRelativeTime(postData.created).value,
  };
});

const handleUpdateCommenters = (rawComments: any[]) => {
  const userMap = new Map();
  rawComments.forEach((comment) => {
    const u = comment.expand?.user;
    if (u && u.id !== currentUser.value?.id) {
      userMap.set(u.id, { id: u.id, name: u.name, avatar: u.avatar });
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

const { showHeaderBack } = useHeader();

// 【关键修复 3】：调整观察器逻辑，确保逻辑不被阻塞
useIntersectionObserver(
  authorRow,
  (entries) => {
    const entry = entries[0];
    if (!entry) return;

    const { isIntersecting, boundingClientRect } = entry;

    if (isIntersecting) {
      // 只要作者行可见，立刻关闭 HeaderBack，保证点击不被拦截
      showHeaderBack.value = false;
    } else if (boundingClientRect.top < 0 && mdcReady.value) {
      // 只有在内容完全加载且滚出屏幕时才显示 HeaderBack
      showHeaderBack.value = true;
    }
  },
  { threshold: 0, rootMargin: "-20px 0px 0px 0px" }
);

onBeforeRouteLeave(() => { showHeaderBack.value = false; });
onUnmounted(() => { showHeaderBack.value = false; });

onActivated(async () => {
  const currentId = route.params.id as string;
  if (updatedPostIds.value.has(currentId)) {
    isUpdateRefresh.value = true;
    await refresh();
    mdcReady.value = false;
    if (commentListRef.value) {
      commentListRef.value.fetchComments(true);
    }
    clearUpdateMark(currentId);
  }
});

const handleMdcMounted = () => {
  // requestAnimationFrame 确保在浏览器下次重绘前更新状态，这比 setTimeout(0) 更快且更流畅
  requestAnimationFrame(() => {
    mdcReady.value = true;
    isUpdateRefresh.value = false;
  });
};

watch(() => route.params.id, () => {
  mdcReady.value = false;
});
</script>

<style scoped>
.fade-enter-active {
  transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
}

.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
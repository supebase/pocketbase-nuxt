<template>
  <div class="container mx-auto">
    <UAlert
      v-if="error"
      :title="error.message"
      variant="soft"
      color="error" />

    <Transition
      name="fade"
      mode="out-in">
      <div
        v-if="status === 'pending'"
        key="loading"
        class="flex flex-col gap-6 mt-4">
        <SkeletonPost />
      </div>

      <div
        v-else-if="postWithRelativeTime"
        key="content">
        <div
          ref="authorRow"
          class="flex flex-col items-center justify-center gap-3">
          <div class="flex items-center justify-between gap-2 w-full">
            <div class="flex items-center gap-3">
              <UIcon
                v-if="postWithRelativeTime.icon"
                :name="postWithRelativeTime.icon"
                class="size-8 text-primary" />
              <div
                v-else
                class="size-8">
                <CommonGravatar
                  :avatar-id="postWithRelativeTime.expand?.user?.avatar"
                  :size="64" />
              </div>
              <div class="text-sm text-dimmed">
                {{ postWithRelativeTime.relativeTime }}
                <span class="mx-1.5">&bull;</span>
                {{ useReadingTime(postWithRelativeTime.content) }}
              </div>
            </div>

            <div>
              <UIcon
                name="hugeicons:arrow-turn-backward"
                class="size-6 text-dimmed cursor-pointer"
                @click="$router.back()" />
            </div>
          </div>
        </div>

        <div class="relative mt-6">
          <Transition leave-active-class="transition duration-300 opacity-0">
            <div
              v-if="!mdcReady"
              class="absolute inset-0 h-40 flex items-center justify-center bg-white/50 dark:bg-neutral-900/50 z-10 backdrop-blur-sm rounded-lg">
              <UIcon
                name="hugeicons:refresh"
                class="size-5 mr-2 animate-spin" />
              <span class="text-sm font-medium">排版中...</span>
            </div>
          </Transition>

          <div
            :class="[
              'transition-all duration-500',
              mdcReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
            ]">
            <MDC
              :key="postWithRelativeTime.id"
              :value="postWithRelativeTime.content || ''"
              @vue:mounted="handleMdcMounted"
              class="prose prose-neutral dark:prose-invert" />
          </div>
        </div>

        <div
          :class="[
            'transition-all duration-700 delay-300',
            mdcReady ? 'opacity-100' : 'opacity-0',
          ]">
          <CommentsCommentForm
            v-if="loggedIn && !isListLoading && postWithRelativeTime.allow_comment"
            :post-id="postWithRelativeTime.id"
            :raw-suggestions="commenters"
            @comment-created="onCommentSuccess"
            class="mt-8" />

          <CommentsCommentList
            ref="commentListRef"
            :post-id="postWithRelativeTime.id"
            :allow-comment="postWithRelativeTime.allow_comment"
            @loading-change="(val) => (isListLoading = val)"
            @update-commenters="handleUpdateCommenters" />
        </div>
      </div>

      <div
        v-else
        key="empty"
        class="flex flex-col items-center justify-center py-20">
        <UEmpty
          variant="naked"
          title="内容无法找到"
          description="当前访问的内容已不存在，建议返回首页浏览其他内容"
          :actions="[
            {
              label: '返回首页',
              color: 'neutral',
              to: '/',
            },
          ]" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { PostRecord } from "~/types/posts";
import type { CommentRecord } from "~/types/comments";
import { useIntersectionObserver } from "@vueuse/core";

const { loggedIn, user: currentUser } = useUserSession();
const route = useRoute();
const { id } = route.params;

const isListLoading = ref(false);
const mdcReady = ref(false);
const commentListRef = ref();
const commenters = ref<any[]>([]);

const { data, status, error } = await useLazyFetch<{ data: PostRecord }>(
  `/api/collections/post/${id}`,
  {
    server: true,
  }
);

const postWithRelativeTime = computed(() => {
  if (!data.value?.data) return null;
  return {
    ...data.value.data,
    relativeTime: useRelativeTime(data.value.data.created).value,
  };
});

// 记录原始评论数据，以便在登录状态切换时重新过滤
const rawCommentsCache = ref<CommentRecord[]>([]);

const handleUpdateCommenters = (rawComments: CommentRecord[]) => {
  // 存一份备份
  rawCommentsCache.value = rawComments;

  const userMap = new Map();
  rawComments.forEach((comment) => {
    const user = comment.expand?.user;
    if (user && user.id !== currentUser.value?.id) {
      userMap.set(user.id, { id: user.id, name: user.name, avatar: user.avatar });
    }
  });
  commenters.value = Array.from(userMap.values());
};

watch(
  currentUser,
  () => {
    if (rawCommentsCache.value.length > 0) {
      handleUpdateCommenters(rawCommentsCache.value);
    }
  },
  { deep: true }
);

const onCommentSuccess = (newComment: CommentRecord) => {
  if (commentListRef.value) {
    commentListRef.value.handleCommentCreated(newComment);
  }
  refreshNuxtData(`comments-data-${id}`);
};

const handleMdcMounted = () => setTimeout(() => (mdcReady.value = true), 300);

watch(
  () => route.params.id,
  () => (mdcReady.value = false)
);

const { showHeaderBack } = useHeader();

const authorRow = ref<HTMLElement | null>(null);

const isContentReady = computed(() => {
  return status.value === "success" && mdcReady.value && authorRow.value !== null;
});

// 1. 页面销毁时重置
onUnmounted(() => {
  showHeaderBack.value = false;
});

// 2. 路由跳转前置重置 (防止返回后 logo 不恢复)
onBeforeRouteLeave(() => {
  showHeaderBack.value = false;
});

// 3. 修改原有的监听逻辑，确保它是准确的
useIntersectionObserver(
  authorRow,
  (entries) => {
    // 1. 获取第一个条目
    const entry = entries[0];

    // 2. 只有当 entry 存在且内容就绪时才执行逻辑
    if (!entry || !isContentReady.value) return;

    // 3. 此时 entry.isIntersecting 就可以安全访问了
    const { isIntersecting, boundingClientRect } = entry;

    if (isIntersecting) {
      showHeaderBack.value = false;
    } else if (boundingClientRect.top < 0) {
      // 只有当元素滚出顶部（top 为负）时才显示返回
      showHeaderBack.value = true;
    }
  },
  {
    threshold: 0,
    rootMargin: "-20px 0px 0px 0px",
  }
);

// 离开页面时必须重置，防止影响到首页
onBeforeUnmount(() => {
  showHeaderBack.value = false;
});
</script>

<style scoped>
/* 1. 定义过渡过程 */
.fade-enter-active {
  /* 进入动画：时间稍长，带有一种顺滑的减速感 */
  transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
}

.fade-leave-active {
  /* 离开动画：时间稍短，快速让位 */
  transition: all 0.3s cubic-bezier(0.4, 0, 1, 1);
}

/* 3. 骨架屏特有的脉冲速度优化 (可选) */
:deep(.animate-pulse) {
  animation-duration: 1.2s; /* 让骨架屏闪烁得更慢一点，显得更优雅不急促 */
}
</style>

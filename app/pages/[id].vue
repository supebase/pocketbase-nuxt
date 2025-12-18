<template>
  <div class="container mx-auto">
    <UAlert
      v-if="error"
      :title="error.message"
      variant="soft"
      color="error"
      class="mt-4" />

    <div
      v-else-if="status === 'pending'"
      class="flex justify-center items-center min-h-[calc(100vh-14rem)]">
      <UIcon
        name="svg-spinners:ring-resize"
        class="size-7 text-primary" />
    </div>

    <div v-else-if="postWithRelativeTime">
      <div class="flex flex-col items-center justify-center gap-3">
        <div class="flex items-center justify-between gap-2 w-full">
          <div class="flex items-center gap-3">
            <UIcon
              v-if="postWithRelativeTime.icon"
              :name="postWithRelativeTime.icon"
              class="size-8 text-primary" />
            <UAvatar
              v-else
              :src="`https://gravatar.loli.net/avatar/${postWithRelativeTime.expand?.user?.avatar}?s=64&r=G`"
              class="size-8" />
            <div class="text-sm text-dimmed">
              {{ postWithRelativeTime.relativeTime }}
              <span class="mx-1.5">&bull;</span>
              {{ useReadingTime(postWithRelativeTime.content) }}
            </div>
          </div>

          <div class="text-sm text-dimmed">
            <UIcon
              name="hugeicons:arrow-turn-backward"
              class="size-6 text-dimmed cursor-pointer"
              @click="$router.back()" />
          </div>
        </div>
      </div>

      <div class="relative mt-6">
        <Transition
          leave-active-class="transition duration-300 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0">
          <div
            v-if="!mdcReady"
            class="absolute inset-x-0 top-0 flex items-center justify-center py-10 text-neutral-400 bg-white/50 dark:bg-neutral-900/50 z-10 backdrop-blur-sm rounded-lg">
            <UIcon
              name="hugeicons:reload"
              class="size-6 mr-2 animate-spin" />
            <span class="text-sm font-medium">正在排版正文...</span>
          </div>
        </Transition>

        <div
          :class="[
            'transition-all duration-500 ease-out',
            mdcReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
          ]">
          <MDC
            :key="postWithRelativeTime.id"
            :value="postWithRelativeTime.content || ''"
            @vue:mounted="handleMdcMounted"
            class="prose prose-neutral dark:prose-invert max-w-none" />
        </div>
      </div>

      <div
        class="transition-all duration-700 delay-300"
        :class="mdcReady ? 'opacity-100' : 'opacity-0'">
        <Transition
          enter-active-class="transition duration-500 ease-out"
          enter-from-class="opacity-0 translate-y-4"
          enter-to-class="opacity-100 translate-y-0">
          <CommentsCommentForm
            v-if="loggedIn && !isListLoading && postWithRelativeTime.allow_comment"
            :post-id="postWithRelativeTime.id"
            :raw-suggestions="commenters"
            @comment-created="onCommentSuccess"
            class="mt-8" />
        </Transition>

        <CommentsCommentList
          ref="commentListRef"
          :post-id="postWithRelativeTime.id"
          :allow-comment="postWithRelativeTime.allow_comment"
          @loading-change="(val: boolean) => (isListLoading = val)"
          @update-commenters="handleUpdateCommenters" />
      </div>
    </div>

    <div
      v-else
      class="flex flex-col items-center justify-center space-y-4 min-h-[calc(100vh-14rem)] pt-16">
      <UIcon
        name="hugeicons:file-empty-02"
        class="text-4xl text-neutral-300 dark:text-neutral-700" />
      <p class="text-neutral-400 dark:text-neutral-700 text-sm font-medium">文章不存在或已被删除</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PostRecord } from "~/types/posts";
import type { CommentRecord } from "~/types/comments";

const { loggedIn, user: currentUser } = useUserSession();
const route = useRoute();
const { id } = route.params;

// --- 状态管理 ---
const isListLoading = ref(false);
const mdcReady = ref(false);
const commentListRef = ref<any>(null); // 用于引用评论列表组件

// --- 获取帖子详情 ---
const { data, status, error } = await useLazyFetch<{
  message: string;
  data: PostRecord;
}>(`/api/posts/${id}`, {
  server: true,
  dedupe: "cancel",
});

const post = computed(() => data.value?.data || null);

// 处理相对时间和阅读时间
const postWithRelativeTime = computed(() => {
  if (!post.value) return null;
  const relativeTime = useRelativeTime(post.value.created).value;
  return {
    ...post.value,
    relativeTime,
  };
});

// --- 提及功能（Mention）核心数据计算 ---
/**
 * 扫描评论列表，提取所有不重复的评论者用户信息
 * 用于传递给 CommentForm 组件的 UEditorMentionMenu
 */
const commenters = ref<any[]>([]); // 改用 ref 存储

const handleUpdateCommenters = (rawComments: CommentRecord[]) => {
  const userMap = new Map();

  rawComments.forEach((comment) => {
    const user = comment.expand?.user;
    // 排除自己
    if (user && user.id !== currentUser.value?.id) {
      userMap.set(user.id, {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
      });
    }
  });

  commenters.value = Array.from(userMap.values());
};

// --- 事件处理 ---

/**
 * 当新评论通过表单创建成功后
 * 1. 通知评论列表组件 (CommentList) 立即插入新数据 (UI反馈)
 * 2. 标记首页缓存过期 (数据同步)
 */
const onCommentSuccess = (newComment: CommentRecord) => {
  if (!postWithRelativeTime.value) return;

  // 1. 本地更新：让当前页面的列表立刻多出一条评论
  if (commentListRef.value && typeof commentListRef.value.handleCommentCreated === "function") {
    commentListRef.value.handleCommentCreated(newComment);
  }

  // 2. 跨页更新：通知首页那个 Key 为 'comments-data-xxx' 的组件去刷新
  // 这样你点击“返回”回到首页时，首页的头像组才会显示出最新的头像
  refreshNuxtData(`comments-data-${postWithRelativeTime.value.id}`);
};

// MDC 渲染完成处理
const handleMdcMounted = () => {
  setTimeout(() => {
    mdcReady.value = true;
  }, 300);
};

// 监听路由变化，重置 MDC 状态
watch(
  () => route.params.id,
  () => {
    mdcReady.value = false;
  }
);
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <UAlert
      v-if="error"
      :title="error.message"
      variant="soft"
      color="error"
      class="mt-4 max-w-4xl mx-auto" />

    <div
      v-else-if="status === 'pending'"
      class="max-w-4xl mx-auto flex justify-center items-center py-16 min-h-[calc(100vh-14rem)]">
      <UIcon
        name="svg-spinners:ring-resize"
        class="size-7 text-primary" />
    </div>

    <div
      v-else-if="post"
      class="max-w-4xl mx-auto">
      <div class="flex items-center gap-2 text-gray-500 mb-6">
        <span>{{ post.expand?.user?.name }}</span>
        <span>•</span>
        <span>{{ useRelativeTime(post.created).value }}</span>
      </div>
      <div class="mt-8">
        <MDC :value="post.content" />
      </div>

      <CommentForm
        v-if="loggedIn && post"
        :post-id="post.id"
        @comment-created="handleCommentCreated"
        class="mt-8" />

      <div class="flex items-center text-2xl font-bold mt-6 space-x-2">
        <div>评论</div>
        <AnimateNumber :value="comments.length" />
      </div>

      <div
        v-if="commentsLoading"
        class="flex justify-center items-center py-8">
        <UIcon
          name="svg-spinners:ring-resize"
          class="size-7 text-primary" />
      </div>

      <UAlert
        v-else-if="commentsError"
        :title="commentsError.message"
        variant="soft"
        color="error"
        class="mt-4 max-w-4xl mx-auto" />

      <div
        class="mt-12"
        v-else-if="comments.length > 0">
        <transition-group
          name="comment-fade"
          tag="div"
          class="relative space-y-4">
          <UCard
            variant="soft"
            v-for="comment in comments"
            :key="comment.id">
            <div class="flex items-center gap-2 text-gray-500 mb-2">
              <UAvatar
                :src="`https://gravatar.loli.net/avatar/${comment.expand?.user?.avatar}?s=64&r=G`"
                class="size-5" />
              <span class="font-medium text-gray-800 dark:text-gray-200">{{
                comment.expand?.user?.name
              }}</span>
              <span>•</span>
              <span>{{ useRelativeTime(comment.created).value }}</span>
            </div>
            <div class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {{ comment.comment }}
            </div>
          </UCard>
        </transition-group>
      </div>

      <div
        v-else
        class="text-center py-8 text-gray-500">
        暂无评论，快来抢沙发吧！
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
import type { PocketBasePostRecord, PocketBaseCommentRecord } from "~/types/auth.d";
const { loggedIn } = useUserSession();

const route = useRoute();
const { id } = route.params;

// --- 获取帖子详情（不变） ---
const { data, status, error } = await useLazyFetch<{
  message: string;
  data: PocketBasePostRecord;
}>(`/api/post/${id}`, {
  server: true,
  dedupe: "cancel",
});

const post = computed(() => data.value?.data || null);

// --- 获取评论列表的修改 ---

const comments = ref<PocketBaseCommentRecord[]>([]);
const commentsLoading = ref(true); // 确保初始为 true，等待 fetch 完成

// 【修改点 3: 优化 useLazyFetch 的 options，确保加载状态被正确关闭】
const {
  data: commentsData,
  error: commentsError,
  refresh: refreshComments,
} = await useLazyFetch<{
  message: string;
  data: {
    comments: PocketBaseCommentRecord[];
    totalItems: number;
    page: number;
    perPage: number;
  };
}>(`/api/comments/records?filter=post="${id}"&sort=-created`, {
  server: true,
  dedupe: "cancel",

  // 仅在 post ID 变化且 post 存在时执行，或在首次加载时 (SSR) 执行
  watch: [post],

  // 关键：在请求开始前立即将 commentsLoading 设为 true (以防 refresh 手动触发)
  onRequest() {
    commentsLoading.value = true;
  },

  // 数据返回后，更新 comments 列表并设置加载状态
  onResponse({ response }) {
    comments.value = response._data?.data?.comments || [];
    commentsLoading.value = false;
  },

  // 请求失败时，也务必关闭加载状态
  onResponseError() {
    commentsLoading.value = false;
  },
});

// 2. 修改 handleCommentCreated: 手动插入新评论，不刷新整个列表 (不变)
const handleCommentCreated = (newComment: PocketBaseCommentRecord) => {
  comments.value.unshift(newComment);
};

// 确保在客户端 hydration 完成后，如果 post 数据已经就位，就调用 refreshComments()
onMounted(() => {
  if (!commentsData.value && post.value) {
    refreshComments();
  }
});

onActivated(() => {
  // 当组件被 keep-alive 缓存后，再次进入此页面时会触发此钩子
  if (post.value) {
    refreshComments();
  }
});
</script>

<style scoped>
/* 评论列表过渡动画 (不变) */
.comment-fade-enter-active,
.comment-fade-leave-active {
  transition: all 0.3s ease;
}

/* 新评论进入时的起始状态：不透明度为0，向上位移20px */
.comment-fade-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

/* 现有评论离开时的结束状态：不透明度为0，向上位移20px */
.comment-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* 当非进入/离开的元素移动时，应用过渡效果 */
.comment-fade-move {
  transition: transform 0.3s ease;
}

/* 【修改点 4: 确保离开元素绝对定位，防止布局跳跃】 
  保留并强调此规则。 
*/
.comment-fade-leave-active {
  position: absolute;
  width: 100%; /* 保持宽度，避免抖动 */
}

/* 【修改点 5: 移除冗余的父元素选择器】
  因为在 template 中已经给 <transition-group> 加上了 class="relative"，
  所以这里不需要额外的 CSS 规则来设置 position: relative。
*/
</style>

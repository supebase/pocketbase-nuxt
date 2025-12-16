<template>
  <div class="mt-6">
    <!-- 评论加载状态 -->
    <div
      v-if="loading"
      class="flex justify-center items-center py-8">
      <UIcon
        name="svg-spinners:ring-resize"
        class="size-7 text-primary" />
    </div>

    <!-- 评论错误提示 -->
    <UAlert
      v-else-if="error"
      :title="error.message"
      variant="soft"
      color="error"
      class="mt-4" />

    <!-- 评论列表 -->
    <div
      class="mt-12"
      v-else-if="comments.length > 0">
      <!-- 评论标题和数量 -->
      <div class="flex items-center text-2xl font-bold mb-6 space-x-2">
        <div>评论</div>
        <CommonAnimateNumber :value="comments.length" />
      </div>

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
            <span>{{ comment.relativeTime }}</span>
          </div>
          <div class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {{ comment.comment }}
          </div>
        </UCard>
      </transition-group>
    </div>

    <!-- 无评论提示 -->
    <div
      v-else
      class="text-center py-8 text-gray-500">
      暂无评论，快来抢沙发吧！
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CommentRecord } from "~/types/comments";
import { useRelativeTime } from "~/composables/utils/useRelativeTime";

const props = defineProps<{
  postId: string;
}>();

const emit = defineEmits<{
  "comment-created": [comment: CommentRecord];
}>();

// 评论相关状态
const comments = ref<CommentRecord[]>([]);
const loading = ref(true);
const error = ref<Error | null>(null);

// 获取评论列表
const {
  data: commentsData,
  error: commentsError,
  refresh: refreshComments,
} = await useLazyFetch<{
  message: string;
  data: {
    comments: CommentRecord[];
    totalItems: number;
    page: number;
    perPage: number;
  };
}>(`/api/comments/records?filter=post="${props.postId}"&sort=-created`, {
  server: true,
  dedupe: "cancel",

  // 关键：在请求开始前立即将 loading 设为 true
  onRequest() {
    loading.value = true;
    error.value = null;
  },

  // 数据返回后，更新 comments 列表并设置加载状态
  onResponse({ response }) {
    const rawComments = response._data?.data?.comments || [];
    // 为每个评论添加相对时间
    const commentsWithRelativeTime = rawComments.map((comment) => {
      const relativeTime = useRelativeTime(comment.created).value;
      return {
        ...comment,
        relativeTime,
      };
    });
    comments.value = commentsWithRelativeTime;
    loading.value = false;
  },

  // 请求失败时，也务必关闭加载状态
  onResponseError(err) {
    loading.value = false;
    error.value = new Error(err.response?._data?.message || "获取评论失败");
  },
});

// 处理评论创建事件
const handleCommentCreated = (newComment: CommentRecord) => {
  comments.value.unshift(newComment);
};

// 暴露方法给父组件
defineExpose({
  handleCommentCreated,
});

// 确保在客户端 hydration 完成后，如果需要，刷新评论
onMounted(() => {
  if (!commentsData.value) {
    refreshComments();
  }
});

// 当组件被 keep-alive 缓存后，再次进入时刷新评论
onActivated(() => {
  refreshComments();
});
</script>

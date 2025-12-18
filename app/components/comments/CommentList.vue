<template>
  <div class="mt-6">
    <div
      v-if="loading"
      class="flex justify-center items-center py-8">
      <UIcon
        name="svg-spinners:ring-resize"
        class="size-7 text-primary" />
    </div>

    <UAlert
      v-else-if="error"
      :title="error.message"
      variant="soft"
      color="error"
      class="mt-4" />

    <div v-else-if="comments.length > 0">
      <USeparator
        type="dashed"
        class="mb-6">
        <div class="text-dimmed">评论</div>
        <CommonAnimateNumber
          :value="comments.length"
          class="text-dimmed mx-1.5" />
        <div class="text-dimmed">条</div>
      </USeparator>

      <CommonMotionTimeline
        :items="comments"
        :is-resetting="loading"
        :loading-more="false"
        line-offset="15px"
        :trigger-ratio="0.65">
        <template #indicator="{ item }">
          <UAvatar
            :src="`https://gravatar.loli.net/avatar/${item.expand?.user?.avatar}?s=64&r=G`"
            class="size-8 ring-4 ring-white dark:ring-neutral-900 bg-white dark:bg-neutral-900 shadow-sm" />
        </template>

        <template #title="{ item, index }">
          <div
            :key="item.id"
            :class="[
              !item.initialized && !item.isNew ? 'record-item-animate' : '',
              item.isNew ? 'new-item-animate' : '',
            ]"
            :style="{ '--delay': item.isNew ? '0s' : `${index * 0.08}s` }">
            <div class="flex items-center justify-between text-base font-medium">
              {{ item.expand?.user?.name }}
              <CommonLikeButton
                :comment-id="String(item.id)"
                :initial-likes="item.likes || 0"
                :is-liked="item.isLiked || false"
                @like-change="(liked, likes) => handleLikeChange(liked, likes, item.id)" />
            </div>
          </div>
        </template>

        <template #description="{ item, index }">
          <div
            :key="item.id"
            :class="[
              !item.initialized && !item.isNew ? 'record-item-animate' : '',
              item.isNew ? 'new-item-animate' : '',
            ]"
            :style="{ '--delay': item.isNew ? '0s' : `${index * 0.08}s` }">
            <div class="text-base break-all whitespace-pre-wrap">
              {{ item.comment }}
            </div>
            <div class="text-sm text-dimmed mt-1.5">
              {{ item.relativeTime }}
            </div>
          </div>
        </template>
      </CommonMotionTimeline>

      <USeparator
        label="已经到底了"
        type="dashed"
        class="mt-10" />
    </div>

    <UEmpty
      v-else
      variant="naked"
      :icon="allowComment ? 'hugeicons:comment-02' : 'hugeicons:comment-block-02'"
      :title="allowComment ? '暂无评论' : '评论已关闭'"
      :description="allowComment ? '评论区竟无人类交互记录' : '本评论区已启动勿扰模式'" />
  </div>
</template>

<script setup lang="ts">
import type { CommentRecord, CommentsResponse } from "~/types/comments";

const props = defineProps<{
  postId: string;
  allowComment: boolean;
}>();

const emit = defineEmits(["loading-change", "update-commenters"]);

// 响应式状态
const comments = ref<CommentRecord[]>([]);
const loading = ref(true);
const error = ref<Error | null>(null);

/**
 * 核心请求：获取完整评论列表
 * 使用 key 确保 Nuxt 可以追踪此请求
 */
const { data: commentsData, refresh: refreshComments } = await useLazyFetch<CommentsResponse>(
  `/api/comments/records`,
  {
    key: `comments-list-full-${props.postId}`,
    server: true,
    query: {
      filter: `post="${props.postId}"`,
      sort: "-created",
    },
    onRequest() {
      loading.value = true;
      error.value = null;
    },
    onResponse({ response }) {
      const rawComments = response._data?.data?.comments || [];

      const mapped = rawComments.map((comment: any) => ({
        ...comment,
        relativeTime: useRelativeTime(comment.created).value,
        initialized: true,
      }));

      // 严格合并：如果本地有 isNew 的，优先保留
      const localItems = comments.value;
      const newItems = localItems.filter((c) => c.isNew);

      // 过滤掉服务器中已存在的重复项
      const serverItems = mapped.filter((m: any) => !newItems.some((n) => n.id === m.id));

      comments.value = [...newItems, ...serverItems];
      loading.value = false;
      emit("update-commenters", comments.value);
    },
    onResponseError(err) {
      loading.value = false;
      const msg = (err.response?._data as any)?.message || "获取评论失败";
      error.value = new Error(msg);
    },
  }
);

/**
 * 供 [id].vue 调用的方法：在列表顶部插入新评论
 */
const handleCommentCreated = (newComment: CommentRecord) => {
  // 确保有有效的创建时间
  const createdTime = newComment.created || new Date().toISOString();
  const { value: timeStr } = useRelativeTime(createdTime);

  const formatted: CommentRecord = {
    ...newComment,
    comment: newComment.comment || "", // 确保有评论内容
    created: createdTime, // 使用有效的创建时间
    relativeTime: timeStr,
    likes: 0,
    isLiked: false,
    isNew: true, // 触发 CSS 入场动画
    initialized: false, // 告知 Timeline 这是新内容
  };

  comments.value.unshift(formatted);
  emit("update-commenters", comments.value);

  // 延迟后取消“新项”标记
  setTimeout(() => {
    const target = comments.value.find((c) => c.id === newComment.id);
    if (target) {
      target.isNew = false;
      target.initialized = true;
    }
  }, 2000);
};

/**
 * 处理点赞状态更新
 */
const handleLikeChange = (liked: boolean, likes: number, commentId: string) => {
  const index = comments.value.findIndex((c) => c.id === commentId);
  if (index !== -1 && comments.value[index]) {
    comments.value[index] = {
      ...comments.value[index],
      likes,
      isLiked: liked,
    };
  }
};

// 监听加载状态同步给父组件
watch(loading, (val) => emit("loading-change", val), { immediate: true });

// 暴露接口
defineExpose({ handleCommentCreated, comments });

onMounted(() => {
  if (!commentsData.value) refreshComments();
});

onActivated(() => {
  // KeepAlive 恢复时执行刷新
  refreshComments();
});
</script>

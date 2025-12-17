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

        <template #title="{ item }">
          <div class="flex items-center justify-between w-full">
            <div class="text-base font-medium">
              {{ item.expand?.user?.name }}
            </div>
            <UButton
              variant="link"
              color="neutral"
              icon="hugeicons:favourite"
              label="0" />
          </div>
        </template>

        <template #description="{ item }">
          <div class="text-base break-all whitespace-pre-wrap">
            {{ item.comment }}
          </div>

          <div class="text-sm text-dimmed mt-1.5">
            {{ item.relativeTime }}
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
import { useRelativeTime } from "~/composables/utils/useRelativeTime";

const props = defineProps<{
  postId: string;
  allowComment: boolean;
}>();

const comments = ref<CommentRecord[]>([]);
const loading = ref(true);
const error = ref<Error | null>(null);

const { data: commentsData, refresh: refreshComments } = await useLazyFetch<CommentsResponse>(
  `/api/comments/records?filter=post="${props.postId}"&sort=-created`,
  {
    server: true,
    dedupe: "cancel",
    onRequest() {
      loading.value = true;
      error.value = null;
    },

    onResponse({ response }) {
      // 此时 TypeScript 知道 response._data 是 CommentsResponse 类型
      const rawComments = response._data?.data?.comments || [];

      // 为每个评论添加相对时间
      comments.value = rawComments.map((comment) => {
        const relativeTime = useRelativeTime(comment.created).value;
        return {
          ...comment,
          relativeTime,
        };
      });
      loading.value = false;
    },

    onResponseError(err) {
      loading.value = false;
      // 确保访问安全
      const errorMessage = (err.response?._data as any)?.message || "获取评论失败";
      error.value = new Error(errorMessage);
    },
  }
);

const handleCommentCreated = (newComment: CommentRecord) => {
  const relativeTime = useRelativeTime(newComment.created).value;
  comments.value.unshift({
    ...newComment,
    relativeTime,
  });
};

defineExpose({
  handleCommentCreated,
});

onMounted(() => {
  if (!commentsData.value) refreshComments();
});

onActivated(() => {
  refreshComments();
});
</script>

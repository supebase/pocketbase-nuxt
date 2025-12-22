<template>
  <div class="mt-6">
    <div v-if="loading && comments.length === 0" class="flex justify-center py-8">
      <UIcon name="i-hugeicons:refresh" class="size-6 text-primary animate-spin" />
    </div>

    <div v-else-if="comments.length > 0">
      <USeparator type="dashed" class="mb-6 select-none">
        <CommonAnimateNumber :value="totalItems" class="text-dimmed mx-1.5" />
        <div class="text-dimmed">条评论</div>
      </USeparator>

      <CommonMotionTimeline :items="comments" line-offset="15px" :trigger-ratio="0.55">
        <template #indicator="{ item }">
          <div
            class="size-8 rounded-full ring-4 ring-white dark:ring-neutral-900 shadow-sm overflow-hidden">
            <CommonGravatar :avatar-id="item.expand?.user?.avatar" :size="64" />
          </div>
        </template>

        <template #title="{ item }">
          <div class="flex items-center justify-between text-base font-medium">
            {{ item.expand?.user?.name }}
            <CommonLikeButton :key="item.id" :comment-id="item.id" :initial-likes="item.likes || 0"
              :is-liked="item.isLiked || false"
              @like-change="(liked, likes) => handleLikeChange(liked, likes, item.id, false)" />
          </div>
        </template>

        <template #description="{ item }">
          <div class="text-base break-all whitespace-pre-wrap">{{ item.comment }}</div>
          <div class="text-sm text-dimmed mt-1.5">{{ item.relativeTime }}</div>
        </template>
      </CommonMotionTimeline>

      <div class="flex justify-center mt-8 mb-4 select-none">
        <UButton v-if="hasMore" :loading="isLoadingMore" variant="soft" color="neutral"
          @click="handleLoadMore">
          加载更多评论
        </UButton>
        <USeparator v-else label="已经到底了" type="dashed" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CommentRecord } from "~/types/comments";
import type { LikeRecord } from "~/types/likes";

const props = defineProps<{ postId: string; allowComment: boolean }>();
const emit = defineEmits(["loading-change", "update-commenters"]);

const {
  allItems: comments,
  totalItems,
  isLoadingMore,
  hasMore,
  loadMore,
  resetPagination,
} = usePagination<CommentRecord>();

const { stream: streamComments, pb } = usePocketRealtime<CommentRecord>('comments');
const loading = ref(false);

const fetchCommentsApi = async (page: number) => {
  const res = await $fetch<any>(`/api/collections/comments`, {
    query: {
      filter: `post="${props.postId}"`,
      sort: "-created",
      page,
      perPage: 10,
    },
  });
  const items = (res.data?.comments || []).map((c: any) => ({
    ...c,
    relativeTime: useRelativeTime(c.created).value,
  }));
  return { items, total: res.data?.totalItems || 0 };
};

const lastLoadedPostId = ref<string | null>(null);

const fetchComments = async (isSilent = false) => {
  if (!isSilent && lastLoadedPostId.value === props.postId && comments.value.length > 0) return;
  if (!isSilent) loading.value = true;
  try {
    const result = await fetchCommentsApi(1);
    resetPagination(result.items, result.total);
    lastLoadedPostId.value = props.postId;
    emit("update-commenters", comments.value);
  } finally {
    loading.value = false;
  }
};

const handleLoadMore = () => loadMore(fetchCommentsApi);

const handleLikeChange = (liked: boolean, likes: number, commentId: string, isFromRealtime = false) => {
  const index = comments.value.findIndex((c) => String(c.id) === String(commentId));
  if (index !== -1) {
    const oldItem = comments.value[index];
    if (!oldItem) return;

    const updatedItem: CommentRecord = {
      ...oldItem,
      likes: likes,
      isLiked: isFromRealtime ? (oldItem.isLiked ?? false) : liked
    };

    comments.value.splice(index, 1, updatedItem);
    emit("update-commenters", comments.value);
  }
};

const syncSingleComment = (record: any, action: 'create' | 'update' | 'delete') => {
  const index = comments.value.findIndex(c => c.id === record.id);
  if (action === 'create') {
    if (index === -1) {
      comments.value.unshift({ ...record, relativeTime: useRelativeTime(record.created).value, isNew: true });
      totalItems.value++;
    }
  } else if (action === 'update') {
    if (index !== -1) {
      comments.value.splice(index, 1, { ...comments.value[index], ...record });
    }
  } else if (action === 'delete') {
    if (index !== -1) {
      comments.value.splice(index, 1);
      totalItems.value--;
    }
  }
  emit("update-commenters", comments.value);
};

// 使用 Map 管理不同评论的防抖定时器，防止评论 A 的点赞刷新了评论 B 的定时器
const likeTimers = new Map<string, any>();

onMounted(async () => {
  await fetchComments();

  await streamComments({
    onUpdate: async ({ action, record }) => {
      if (record.post !== props.postId) return;
      let fullComment = record;
      if (action === 'create' || action === 'update') {
        try {
          fullComment = await pb.collection('comments').getOne(record.id, { expand: 'user' });
        } catch (e) { return; }
      }
      syncSingleComment(fullComment, action as any);
    }
  });

  // 订阅点赞表
  pb.collection('likes').subscribe('*', async ({ action, record }) => {
    const likeData = record as unknown as LikeRecord;
    const commentId = likeData.comment;

    if (action === 'create' || action === 'delete') {
      // 获取该评论的专属定时器
      if (likeTimers.has(commentId)) clearTimeout(likeTimers.get(commentId));

      const timer = setTimeout(async () => {
        const index = comments.value.findIndex(c => c.id === commentId);
        if (index === -1) return;

        try {
          const updatedComment = await pb.collection('comments').getOne<CommentRecord>(commentId);
          handleLikeChange(false, updatedComment.likes || 0, commentId, true);
        } catch (e) {
          console.warn("实时同步点赞数失败", e);
        }
        likeTimers.delete(commentId);
      }, 300);

      likeTimers.set(commentId, timer);
    }
  });
});

onUnmounted(() => {
  pb.collection('likes').unsubscribe('*');
  likeTimers.forEach(timer => clearTimeout(timer));
  likeTimers.clear();
});

const handleCommentCreated = (newComment: CommentRecord) => syncSingleComment(newComment, 'create');

defineExpose({ handleCommentCreated, fetchComments });

onActivated(() => {
  if (lastLoadedPostId.value !== props.postId) fetchComments();
});

watch(loading, (val) => emit("loading-change", val));
watch(isLoadingMore, (val) => emit("loading-change", val));
</script>
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
            <CommonLikeButton :key="item.id" :comment-id="String(item.id)"
              :initial-likes="item.likes || 0" :is-liked="item.isLiked || false"
              @like-change="(liked, likes) => handleLikeChange(liked, likes, item.id)" />
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

const props = defineProps<{ postId: string; allowComment: boolean }>();
const emit = defineEmits(["loading-change", "update-commenters"]);
const toast = useToast();

const {
  allItems: comments,
  totalItems,
  isLoadingMore,
  hasMore,
  loadMore,
  resetPagination,
} = usePagination<CommentRecord>();

const loading = ref(false);

// API 请求逻辑
const fetchCommentsApi = async (page: number) => {
  const res = await $fetch<any>(`/api/collections/comments`, {
    query: {
      filter: `post="${props.postId}"`,
      sort: "-created",
      page,
      perPage: 10, // 可以按需调整每页数量
    },
  });

  const items = (res.data?.comments || []).map((c: any) => ({
    ...c,
    relativeTime: useRelativeTime(c.created).value,
  }));

  return { items, total: res.data?.totalItems || 0 };
};

const lastLoadedPostId = ref<string | null>(null);

// 初始化获取
const fetchComments = async (isSilent = false) => {
  // 如果是同一个 ID 且已经有数据，且不是强制刷新，则跳过
  if (!isSilent && lastLoadedPostId.value === props.postId && comments.value.length > 0) {
    return;
  }

  if (!isSilent) loading.value = true;

  try {
    const result = await fetchCommentsApi(1);
    resetPagination(result.items, result.total);
    lastLoadedPostId.value = props.postId; // 更新最后加载的 ID
    emit("update-commenters", comments.value);
  } finally {
    loading.value = false;
  }
};

// 交互函数
const handleLoadMore = () => loadMore(fetchCommentsApi);

// 检查更新
const checkAndRefresh = async () => {
  // 如果 ID 变了，直接重新完整加载
  if (lastLoadedPostId.value !== props.postId) {
    return fetchComments();
  }

  try {
    const result = await fetchCommentsApi(1); // 检查第一页数据

    if (result.total !== totalItems.value) {
      toast.add({
        title: "发现评论更新",
        description: `目前有 ${comments.value.length} 条评论，最新记录 ${result.total} 条。正在刷新...`,
        icon: "i-hugeicons:comment-02",
        color: "info",
      });

      // 数量不一致，说明有新评论，静默刷新
      resetPagination(result.items, result.total);
      emit("update-commenters", comments.value);
    }
  } catch (e) {
    console.warn(e);
  }
};

// 插入新评论
const handleCommentCreated = (newComment: CommentRecord) => {
  const formatted: CommentRecord = {
    ...newComment,
    relativeTime: "刚刚",
    likes: 0,
    isLiked: false,
    isNew: true,
  };
  comments.value.unshift(formatted);
  totalItems.value += 1;
  emit("update-commenters", comments.value);
};

// 点赞处理
const handleLikeChange = (liked: boolean, likes: number, commentId: string) => {
  const comment = comments.value.find((c) => String(c.id) === String(commentId));
  if (comment) {
    comment.likes = likes;
    comment.isLiked = liked;
  }
};

defineExpose({ handleCommentCreated, fetchComments });

onMounted(fetchComments);

onActivated(() => {
  checkAndRefresh();
});

watch(loading, (val) => emit("loading-change", val));
watch(isLoadingMore, (val) => emit("loading-change", val));
</script>

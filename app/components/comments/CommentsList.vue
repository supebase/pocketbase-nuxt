<template>
  <div class="mt-8">
    <div v-if="loading && comments.length === 0" class="flex justify-center py-8">
      <UIcon name="i-hugeicons:refresh" class="size-6 text-primary animate-spin" />
    </div>

    <div v-else-if="comments.length > 0">
      <USeparator type="dashed" class="mb-6 select-none">
        <CommonAnimateNumber :value="totalItems" class="text-dimmed mx-1.5" />
        <div class="text-dimmed">条评论</div>
      </USeparator>

      <ModalDelete v-model:open="isModalOpen" :loading="isDeleting" @confirm="confirmDelete">
        <div v-if="selectedComment" class="flex flex-col gap-2">
          <div class="text-sm text-primary font-semibold">即将消失的数据</div>
          <div class="text-sm text-muted line-clamp-2">{{ selectedComment.comment }}</div>
        </div>
      </ModalDelete>

      <CommonMotionTimeline :items="comments" line-offset="15px" :trigger-ratio="0.55">
        <template #indicator="{ item }">
          <div
            class="size-8 rounded-full ring-4 ring-white dark:ring-neutral-900 shadow-sm overflow-hidden">
            <CommonGravatar :avatar-id="item.expand?.user?.avatar" :size="64" />
          </div>
        </template>

        <template #title="{ item }">
          <div class="flex items-center justify-between text-base font-medium">
            {{ item.expand?.user?.name || '匿名用户' }}
            <div class="flex items-center justify-center gap-5">
              <UIcon v-if="item.expand?.user?.id === user?.id" name="i-hugeicons:delete-01"
                @click="openDeleteModal(item)"
                class="size-5 text-dimmed cursor-pointer hover:text-error transition-colors" />
              <CommonLikeButton :key="item.id" :comment-id="item.id"
                :initial-likes="item.likes || 0" :is-liked="item.isLiked || false"
                @like-change="(liked, likes) => handleLikeChange(liked, likes, item.id, false)" />
            </div>
          </div>
        </template>

        <template #description="{ item }">
          <div class="text-base tracking-wide leading-6 hyphens-none whitespace-pre-wrap">
            <template v-for="(part, index) in parsedContent(item.comment)" :key="index">
              <span v-if="part.isMention" class="text-primary font-semibold">{{ part.text }}</span>
              <span v-else>{{ part.text }}</span>
            </template>
          </div>
          <div class="text-sm text-dimmed mt-1.5">
            {{ item.relativeTime
            }}{{ item.expand?.user?.location ? `，来自${item.expand?.user?.location}` : '' }}
          </div>
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
import type { CommentRecord } from '~/types/comments';
import type { CommentLikesResponse } from '~/types/likes';

const props = defineProps<{ postId: string; allowComment: boolean }>();
const emit = defineEmits(['loading-change', 'update-commenters']);

const { user } = useUserSession();
const likeTimers = new Map<string, any>();

const {
  allItems: comments,
  totalItems,
  isLoadingMore,
  hasMore,
  loadMore,
  resetPagination,
} = usePagination<CommentRecord>();

const { listen } = usePocketRealtime(['comments', 'likes']);
const loading = ref(false);
const isModalOpen = ref(false);
const isDeleting = ref(false);
const selectedComment = ref<CommentRecord | null>(null);
const lastLoadedPostId = ref<string | null>(null);

// 1. 去重逻辑
const getUniqueUsers = (list: CommentRecord[]) => {
  const usersMap = new Map();
  list.forEach((c) => {
    // 关键：在 SSE 模式下，record.expand.user 必须存在
    const u = c.expand?.user;
    if (u) usersMap.set(u.id, { id: u.id, name: u.name, avatar: u.avatar, location: u.location });
  });
  return Array.from(usersMap.values());
};

// 2. 核心同步逻辑 (不再手动 emit)
const syncSingleComment = (record: CommentRecord, action: 'create' | 'update' | 'delete') => {
  const index = comments.value.findIndex((c) => c.id === record.id);
  if (action === 'delete' && index !== -1) {
    comments.value.splice(index, 1);
    totalItems.value = Math.max(0, totalItems.value - 1);
  } else if (action === 'create' && index === -1) {
    comments.value.unshift({ ...record, relativeTime: useRelativeTime(record.created) });
    totalItems.value++;
  } else if (action === 'update' && index !== -1) {
    comments.value[index] = {
      ...comments.value[index],
      ...record,
      expand: { ...(comments.value[index]?.expand || {}), ...(record.expand || {}) },
    };
  }
};

// 3. 关键：监听数组变化并向上同步
watch(
  comments,
  (newVal) => {
    if (newVal) {
      const users = getUniqueUsers(newVal);
      emit('update-commenters', users);
    }
  },
  { deep: true, immediate: true }
);

// 4. API 请求
const fetchCommentsApi = async (page: number) => {
  const res = await $fetch<any>(`/api/collections/comments`, {
    query: { filter: `post="${props.postId}"`, sort: '-created', page, perPage: 10 },
  });
  const items = (res.data?.comments || []).map((c: any) => ({
    ...c,
    relativeTime: useRelativeTime(c.created),
  }));
  return { items, total: res.data?.totalItems || 0 };
};

const fetchComments = async (isSilent = false) => {
  if (!isSilent && lastLoadedPostId.value === props.postId && comments.value.length > 0) return;
  if (!isSilent) loading.value = true;
  try {
    const result = await fetchCommentsApi(1);
    resetPagination(result.items, result.total);
    lastLoadedPostId.value = props.postId;
  } finally {
    loading.value = false;
  }
};

const handleLoadMore = () => loadMore(fetchCommentsApi);

// 5. 点赞同步
const handleLikeChange = (
  liked: boolean,
  likes: number,
  commentId: string,
  isFromRealtime = false
) => {
  const target = comments.value.find((c) => c.id === commentId);
  if (target) {
    target.likes = likes;
    if (!isFromRealtime) target.isLiked = liked;
  }
};

const triggerLikeSync = (commentId: string) => {
  if (likeTimers.has(commentId)) clearTimeout(likeTimers.get(commentId));
  likeTimers.set(
    commentId,
    setTimeout(async () => {
      try {
        const res = await $fetch<CommentLikesResponse>(`/api/collections/likes`, {
          query: { commentIds: JSON.stringify([commentId]) },
        });
        const info = res.data.likesMap[commentId];
        if (info) handleLikeChange(false, info.likes, commentId, true);
      } finally {
        likeTimers.delete(commentId);
      }
    }, 400)
  );
};

// 6. 删除逻辑
const openDeleteModal = (item: CommentRecord) => {
  selectedComment.value = item;
  isModalOpen.value = true;
};
const confirmDelete = async () => {
  if (!selectedComment.value) return;
  isDeleting.value = true;
  try {
    await $fetch(`/api/collections/comment/${selectedComment.value.id}`, { method: 'DELETE' });
    isModalOpen.value = false;
  } finally {
    isDeleting.value = false;
  }
};

// 匹配 @用户名（假设用户名不含空格）
const MENTION_REGEX = /(@\S+)/g;

const parsedContent = (text: string) => {
  if (!text) return [];

  // 将字符串按 @用户名 切分
  return text.split(MENTION_REGEX).map((part) => {
    return {
      text: part,
      isMention: MENTION_REGEX.test(part)
    };
  });
};

onMounted(async () => {
  await fetchComments();
  listen(({ collection, action, record }) => {
    if (collection === 'comments' && record.post === props.postId) {
      syncSingleComment(record as CommentRecord, action as any);
    }
    if (collection === 'likes' && comments.value.some((c) => c.id === record.comment)) {
      triggerLikeSync(record.comment);
    }
  });
});

onUnmounted(() => likeTimers.forEach((t) => clearTimeout(t)));

defineExpose({
  handleCommentCreated: (c: any) => syncSingleComment(c, 'create'),
  fetchComments,
  getUniqueUsers,
  comments,
});

watch([loading, isLoadingMore], ([l1, l2]) => emit('loading-change', l1 || l2));
</script>

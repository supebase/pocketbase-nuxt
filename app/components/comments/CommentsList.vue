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
                class="size-5 text-dimmed cursor-pointer hover:text-primary transition-colors" />
              <CommonLikeButton :key="item.id" :comment-id="item.id"
                :initial-likes="item.likes || 0" :is-liked="item.isLiked || false"
                @like-change="(liked, likes) => handleLikeChange(liked, likes, item.id, false)" />
            </div>
          </div>
        </template>

        <template #description="{ item }">
          <div class="text-base tracking-wide leading-6 hyphens-none whitespace-pre-wrap">{{
            item.comment }}</div>
          <div class="text-sm text-dimmed mt-1.5">
            {{ item.relativeTime }}{{ item.expand?.user?.location ? `，来自${item.expand?.user?.location}` : '' }}
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
import type { CommentRecord } from "~/types/comments";
import type { LikeRecord, CommentLikesResponse } from "~/types/likes";

const props = defineProps<{ postId: string; allowComment: boolean }>();
const emit = defineEmits(["loading-change", "update-commenters"]);

const { user } = useUserSession();
const { $pb } = useNuxtApp();
const toast = useToast();

// --- 1. 使用你提供的 Composable ---
const {
  allItems: comments,
  totalItems,
  isLoadingMore,
  hasMore,
  loadMore,
  resetPagination,
} = usePagination<CommentRecord>();

const { stream: streamComments } = usePocketRealtime<CommentRecord>('comments');

// --- 2. 状态定义 ---
const loading = ref(false);
const lastLoadedPostId = ref<string | null>(null);
const isModalOpen = ref(false);
const isDeleting = ref(false);
const selectedComment = ref<CommentRecord | null>(null);
const likeTimers = new Map<string, any>();

// --- 3. 获取数据 API ---
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

    // 💡 初始化时也要发射扁平用户列表
    emit("update-commenters", getUniqueUsers(comments.value));
  } finally {
    loading.value = false;
  }
};

const handleLoadMore = () => loadMore(fetchCommentsApi);

// --- 4. 同步逻辑 (核心修复) ---
const handleLikeChange = (liked: boolean, likes: number, commentId: string, isFromRealtime = false) => {
  const target = comments.value.find((c) => c.id === commentId);
  if (target) {
    target.likes = likes;
    if (!isFromRealtime) target.isLiked = liked;
    emit("update-commenters", comments.value);
  }
};

const getUniqueUsers = (commentList: CommentRecord[]) => {
  const usersMap = new Map();
  commentList.forEach(c => {
    // 关键点：从 expand.user 中提取用户信息
    if (c.expand?.user) {
      usersMap.set(c.expand.user.id, {
        id: c.expand.user.id,
        name: c.expand.user.name,
        avatar: c.expand.user.avatar,
        location: c.expand.user.location,
      });
    }
  });
  return Array.from(usersMap.values());
};

const syncSingleComment = (record: CommentRecord, action: 'create' | 'update' | 'delete') => {
  const index = comments.value.findIndex(c => c.id === record.id);

  if (action === 'create') {
    if (index === -1) {
      comments.value.unshift({ ...record, relativeTime: useRelativeTime(record.created) });
      totalItems.value++;
    }
  } else if (action === 'update') {
    if (index !== -1) {
      comments.value[index] = { ...comments.value[index], ...record };
    }
  } else if (action === 'delete') {
    if (index !== -1) {
      comments.value.splice(index, 1);
      totalItems.value = Math.max(0, totalItems.value - 1);
    }
  }

  // 💡 发射给父组件时，确保是扁平的用户列表，而不是评论对象列表
  emit("update-commenters", getUniqueUsers(comments.value));
};

// --- 5. 删除操作 ---
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
    // 这里不需要手动 splice，实时流会处理 delete action
  } catch (err: any) {
    toast.add({ title: "删除失败", color: "error" });
  } finally {
    isDeleting.value = false;
    selectedComment.value = null;
  }
};

// --- 6. 生命周期与实时订阅 ---
onMounted(async () => {
  await fetchComments();

  // A. 评论内容流 (使用你修改后的 usePocketRealtime)
  await streamComments({
    expand: 'user',
    fields: 'id,comment,post,likes,created,expand.user.id,expand.user.name,expand.user.avatar,expand.user.location',
    onUpdate: ({ action, record }) => {
      // 💡 修复点：record 已经是 usePocketRealtime 补全后的 fullRecord，直接传入
      if (record.post !== props.postId) return;
      syncSingleComment(record as CommentRecord, action as any);

      emit("update-commenters", [...comments.value]);
    }
  });

  // B. 点赞实时订阅 (Likes 是独立表，单独处理)
  $pb.collection('likes').subscribe('*', (event) => {
    const likeData = event.record as unknown as LikeRecord;
    const commentId = likeData.comment;

    // 仅处理当前列表存在的评论
    if (!comments.value.some(c => c.id === commentId)) return;

    if (likeTimers.has(commentId)) clearTimeout(likeTimers.get(commentId));

    const timer = setTimeout(async () => {
      try {
        const res = await $fetch<CommentLikesResponse>(`/api/collections/likes`, {
          query: { commentIds: JSON.stringify([commentId]) }
        });
        const updatedInfo = res.data.likesMap[commentId];
        if (updatedInfo) {
          handleLikeChange(false, updatedInfo.likes, commentId, true);
        }
      } catch (e) {
        console.warn("Sync likes failed", e);
      }
      likeTimers.delete(commentId);
    }, 400);

    likeTimers.set(commentId, timer);
  });
});

onUnmounted(() => {
  $pb.collection('likes').unsubscribe('*');
  likeTimers.forEach(timer => clearTimeout(timer));
});

// --- 7. 其他逻辑 ---
const handleCommentCreated = (newComment: CommentRecord) => syncSingleComment(newComment, 'create');
defineExpose({ handleCommentCreated, fetchComments, comments });

onActivated(() => {
  if (lastLoadedPostId.value !== props.postId) fetchComments();
});

watch([loading, isLoadingMore], ([l1, l2]) => emit("loading-change", l1 || l2));
</script>
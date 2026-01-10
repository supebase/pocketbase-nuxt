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
          <div class="text-sm text-muted line-clamp-2">
            {{ selectedComment.comment }}
          </div>
        </div>
      </ModalDelete>

      <CommonMotionTimeline :items="comments" line-offset="15px" :trigger-ratio="0.55">
        <template #indicator="{ item }">
          <CommonGravatar :avatar-id="item.expand?.user?.avatar" :size="64" />
        </template>

        <template #title="{ item }">
          <div class="flex items-center justify-between text-base font-medium">
            {{ item.expand?.user?.name || '匿名用户' }}
            <div class="flex items-center justify-center gap-5">
              <UIcon
                v-if="item.expand?.user?.id === user?.id"
                name="i-hugeicons:delete-01"
                @click="openDeleteModal(item)"
                class="size-5 text-dimmed cursor-pointer hover:text-error transition-colors"
              />
              <CommonLikeButton
                :key="item.id"
                :comment-id="item.id"
                :initial-likes="item.likes"
                :is-liked="item.isLiked"
                @like-change="(liked, lks) => handleLikeChange(liked, lks, item.id, false)"
              />
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
            }}{{
              item.expand?.user?.location
                ? `，来自${formatLocation(item.expand?.user?.location)}`
                : ''
            }}
          </div>
        </template>
      </CommonMotionTimeline>

      <div class="flex justify-center mt-8 mb-4 select-none">
        <UButton
          v-if="hasMore"
          :loading="isLoadingMore"
          variant="soft"
          color="neutral"
          @click="handleLoadMore"
        >
          加载更多评论
        </UButton>
        <USeparator v-else label="已经到底了" type="dashed" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CommentRecord } from '~/types/comments';
import { MENTION_REGEX } from '~/constants';

const props = defineProps<{ postId: string; allowComment: boolean }>();
const emit = defineEmits(['loading-change', 'update-commenters']);

const { user, loggedIn } = useUserSession();

const {
  comments,
  totalItems,
  loading,
  isLoadingMore,
  hasMore,
  fetchComments,
  handleLoadMore,
  syncSingleComment,
  handleLikeChange,
  getUniqueUsers,
} = useComments(props.postId);

const { listen, close } = usePocketRealtime(['comments', 'likes']);
const isModalOpen = ref(false);
const isDeleting = ref(false);
const selectedComment = ref<CommentRecord | null>(null);

// 1. 删除处理
const openDeleteModal = (item: CommentRecord) => {
  selectedComment.value = item;
  isModalOpen.value = true;
};

const confirmDelete = async () => {
  if (!selectedComment.value) return;

  isDeleting.value = true;

  try {
    await $fetch(`/api/collections/comment/${selectedComment.value.id}`, {
      method: 'DELETE',
    });
    isModalOpen.value = false;
  } finally {
    isDeleting.value = false;
  }
};

// 2. 文本解析 (@提到)
const parsedContent = (text: string) => {
  if (!text) return [];

  return text
    .split(MENTION_REGEX)
    .filter((part) => part !== '')
    .map((part) => {
      const isMention = part.startsWith('@') && part.length > 1;

      return {
        text: part,
        isMention: isMention,
      };
    });
};

// 3. 实时监听与初始化
if (import.meta.client) {
  onMounted(async () => {
    listen(({ collection, action, record }) => {
      // 评论逻辑
      if (collection === 'comments' && record.post === props.postId) {
        syncSingleComment(record as CommentRecord, action as any);
      }
      // 点赞逻辑
      if (collection === 'likes') {
        const targetCommentId = record.comment;
        const target = comments.value.find((c) => c.id === targetCommentId);

        if (target) {
          // 1. 防御性处理：确保数字有效
          if (typeof target.likes !== 'number') target.likes = 0;

          const newLikes = action === 'create' ? target.likes + 1 : Math.max(0, target.likes - 1);

          // 2. 核心修正点：使用 ?? false 确保传入的是 boolean 而非 undefined
          handleLikeChange(
            target.isLiked ?? false, // 如果是 undefined，则默认为 false
            newLikes,
            targetCommentId,
            true,
          );
        }
      }
    });

    await fetchComments();
  });
  // 显式清理连接
  onUnmounted(() => {
    close();
  });
}

// 4. 向上层同步
watch(comments, () => emit('update-commenters', getUniqueUsers()), {
  deep: true,
});

watch(loggedIn, (val) => val && fetchComments(true));

watch([loading, isLoadingMore], ([l1, l2]) => emit('loading-change', l1 || l2));

// 暴露给外部 (如 CommentsForm)
defineExpose({
  handleCommentCreated: (c: any) => syncSingleComment(c, 'create'),
  comments,
  getUniqueUsers,
});
</script>

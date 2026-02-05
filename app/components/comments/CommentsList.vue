<template>
  <div class="mt-8">
    <div v-if="isFirstLoad && loading" class="flex justify-center">
      <SkeletonWrapper type="comments" />
    </div>

    <div v-else>
      <USeparator type="dashed" class="mb-6 select-none" v-if="totalItems > 0">
        <CommonAnimateNumber :value="totalItems" class="text-dimmed mx-1.5 mt-0.5" />
        <div class="text-dimmed">条评论</div>
      </USeparator>

      <ModalDelete v-model:open="isModalOpen" :loading="isDeleting" @confirm="confirmDelete">
        <div v-if="selectedComment" class="flex flex-col gap-2 select-none">
          <div class="text-sm text-primary font-semibold">即将消失的数据</div>
          <div class="text-sm text-muted line-clamp-2">
            {{ selectedComment.comment }}
          </div>
        </div>
      </ModalDelete>

      <CommonMotionTimeline :items="comments" line-offset="15px" :trigger-ratio="0.55">
        <template #indicator="{ item }">
          <CommonAvatar
            :avatar-id="item.expand?.user?.avatar"
            :avatar-github="item.expand?.user?.avatar_github"
            :user-id="item.expand?.user?.id"
            :size="64"
            class="size-7"
          />
        </template>

        <template #title="{ item }">
          <div class="flex items-center justify-between select-none">
            <div class="flex items-center space-x-3">
              <span class="text-base font-medium">{{ item.expand?.user?.name || '匿名用户' }}</span>
              <span class="text-sm text-dimmed tabular-nums">{{ item.relativeTime }}</span>
            </div>
            <div>
              <CommonLikeButton
                :key="item.id"
                :comment-id="item.id"
                :initial-likes="item.likes"
                :is-liked="item.isLiked"
                @like-change="(liked, lks, id) => handleLikeChange(liked, lks, id, false)"
              />
            </div>
          </div>
        </template>

        <template #description="{ item }">
          <div class="text-base tracking-wide leading-6 hyphens-none whitespace-pre-wrap">
            <template v-for="(part, index) in parsedContent(item.comment)" :key="index">
              <span v-if="part.isMention" class="text-primary font-semibold select-none">{{ part.text }}</span>
              <span v-else>{{ part.text }}</span>
            </template>
          </div>
          <div class="flex items-center mt-2 select-none">
            <div
              v-if="item.expand?.user?.id === user?.id"
              @click="!isDeleting && openDeleteModal(item)"
              :class="['text-sm mr-3 text-error', isDeleting ? 'cursor-not-allowed' : 'cursor-pointer']"
            >
              删除
            </div>
            <div class="text-sm text-dimmed">
              {{ item.expand?.user?.location ? `${formatLocation(item.expand?.user?.location)}` : '坐标丢失 ...' }}
            </div>
          </div>
        </template>
      </CommonMotionTimeline>

      <div
        v-if="comments.length === 0"
        class="flex flex-col gap-5 items-center justify-center text-sm text-dimmed/50 min-h-[20vh]"
      >
        <UIcon name="i-hugeicons:comment-02" class="size-9 text-dimmed/20" />
        评论区比我的代码注释还干净
      </div>

      <div class="flex justify-center mt-8 mb-4 select-none">
        <UButton
          v-if="hasMore"
          :loading="isLoadingMore"
          color="neutral"
          class="cursor-pointer px-6"
          @click="handleLoadMore"
          :ui="{ base: 'h-9' }"
        >
          加载更多
        </UButton>
        <USeparator v-else-if="!hasMore && comments.length > 0" label="已经到底了" type="dashed" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CommentRecord } from '~/types';
import { MENTION_REGEX } from '~/constants';

const props = defineProps<{ postId: string; allowComment: boolean }>();

const emit = defineEmits<{
  'loading-change': [isLoading: boolean];
  'update-commenters': [users: any[]];
}>();

const { user, loggedIn } = useUserSession();

const {
  comments,
  totalItems,
  loading,
  isFirstLoad,
  isLoadingMore,
  hasMore,
  fetchComments,
  handleLoadMore,
  syncSingleComment,
  handleLikeChange,
  getUniqueUsers,
} = useComments(props.postId);

const { listen, close } = usePocketRealtime();
const isModalOpen = ref(false);
const isDeleting = ref(false);
const selectedComment = ref<CommentRecord | null>(null);

// 1. 删除处理
const openDeleteModal = (item: CommentRecord) => {
  selectedComment.value = item;
  isModalOpen.value = true;
};

const confirmDelete = async () => {
  if (!selectedComment.value || isDeleting.value) return; // 1. 防止重复点击

  isDeleting.value = true;
  const targetToDelete = selectedComment.value; // 2. 局部变量锁定当前要删除的对象
  const startTime = Date.now();

  try {
    await $fetch(`/api/collections/comment/${targetToDelete.id}`, {
      method: 'DELETE',
    });

    const elapsed = Date.now() - startTime;
    const minDisplayTime = 500;
    if (elapsed < minDisplayTime) {
      await new Promise((resolve) => setTimeout(resolve, minDisplayTime - elapsed));
    }

    // 动画协调：先关弹窗
    isModalOpen.value = false;

    // 弹窗关闭动画后再清理数据
    setTimeout(() => {
      syncSingleComment(targetToDelete, 'delete');
      // 只有在当前选中的还是这个评论时才重置，防止误删新选中的对象
      if (selectedComment.value?.id === targetToDelete.id) {
        selectedComment.value = null;
      }
    }, 300);
  } catch (err) {
    // 逻辑失败，恢复状态
    // console.error('Delete failed:', err);
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
const setupRealtime = () => {
  if (import.meta.server) return;

  listen(({ collection, action, record }) => {
    // 评论逻辑
    if (collection === 'comments' && record.post === props.postId) {
      syncSingleComment(record as CommentRecord, action as any);
    }

    // 点赞逻辑
    if (collection === 'likes') {
      const targetCommentId = record.comment;
      // 使用 find 查找对象引用
      const target = comments.value.find((c) => c.id === targetCommentId);

      // 关键修正：增加防御性判断，只有找到目标评论才处理
      if (!target) return;

      const currentLikes = target.likes || 0;
      const newLikes = action === 'create' ? currentLikes + 1 : Math.max(0, currentLikes - 1);

      // 此时调用 handleLikeChange，最后一个参数 true 表示这是来自服务器的同步，不需要再发 API
      handleLikeChange(target.isLiked ?? false, newLikes, targetCommentId, true);
    }
  });
};

if (import.meta.client) {
  onMounted(async () => {
    setupRealtime();
    await fetchComments();
  });

  onUnmounted(() => {
    close();
  });
}

// 4. 向上层同步
watch(comments, () => emit('update-commenters', getUniqueUsers()), {
  deep: true,
});

watch(loggedIn, (val) => val && fetchComments(true));

// 监听用户变化，当用户切换时重新获取评论数据
watch(
  () => user.value?.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      // 用户切换时，使用 forceRefresh=true 强制重新获取评论
      fetchComments(true, true);
    }
  },
);

watch([loading, isLoadingMore], ([l1, l2]) => emit('loading-change', l1 || l2));

// 暴露给外部 (如 CommentsForm)
defineExpose({
  handleCommentCreated: (c: any) => syncSingleComment(c, 'create'),
  comments,
  getUniqueUsers,
});
</script>

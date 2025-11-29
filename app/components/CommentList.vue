<template>
  <UCard class="w-full mt-6">
    <template #header>
      <h3 class="text-lg font-semibold">评论 ({{ comments.length }})</h3>
    </template>
    <div v-if="comments.length === 0" class="py-8 text-center text-muted-foreground">
      暂无评论，快来发表第一条评论吧！
    </div>
    <div v-else class="space-y-4">
      <UCard
        v-for="comment in comments"
        :key="comment.id"
        variant="subtle"
      >
        <div class="flex justify-between items-start mb-3">
          <div class="font-semibold">{{ getCommentAuthorName(comment) }}</div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground italic">{{ formatDate(comment.created) }}</span>
            <UButton
              v-if="canDeleteComment(comment)"
              size="sm"
              color="error"
              variant="ghost"
              @click="handleDeleteComment(comment.id)"
              :loading="isDeleting[comment.id]"
            >
              删除
            </UButton>
          </div>
        </div>
        <div>{{ comment.comment }}</div>
      </UCard>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { CommentModel } from "~/types/comment";
import { useDateRelative } from "~/composables/useDateRelative";

// Props
const { comments } = defineProps<{
  comments: CommentModel[];
}>();

// Emits
const emit = defineEmits<{
  (_e: "delete", _commentId: string): void;
}>();

// Composables
const { currentUser } = useAuth();
const { formatDate } = useDateRelative();

// State
const isDeleting = ref<Record<string, boolean>>({});

// Methods
const getCommentAuthorName = (comment: CommentModel): string => {
  // 从expand字段中获取用户信息
  const user = comment.expand?.user;
  if (user && "name" in user) {
    return (user.name || user.email.split("@")[0]) as string;
  }
  return "未知用户";
};

const canDeleteComment = (comment: CommentModel): boolean => {
  if (!currentUser.value) return false;
  
  // comment.user 现在是字符串ID，直接比较
  // 只有评论作者或已验证用户可以删除评论
  return comment.user === currentUser.value.id || currentUser.value.verified;
};

const handleDeleteComment = async (commentId: string) => {
  try {
    isDeleting.value[commentId] = true;
    emit("delete", commentId);
  } finally {
    isDeleting.value[commentId] = false;
  }
};
</script>

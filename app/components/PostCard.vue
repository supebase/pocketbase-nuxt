<template>
  <UPageCard
    :to="`/posts/${post.id}`"
    variant="subtle"
    class="w-full"
  >
    <template #header>
      <h2 class="text-xl font-bold text-primary-600 hover:text-primary-800 transition-colors">{{ post.title }}</h2>
      <div class="flex flex-wrap gap-2 text-sm text-gray-600 mt-1">
        <div class="flex items-center gap-1">
          <span class="font-medium">作者：</span>
          {{ getPostAuthorName(post) }}
        </div>
        <div class="flex items-center gap-1">
          <span class="font-medium">发布时间：</span>
          {{ formatDate(post.created) }}
        </div>
      </div>
    </template>
    <template #body>
      <p class="text-gray-700 line-clamp-3">{{ getPostExcerpt(post.content) }}</p>
    </template>
    <template #footer>
      <div v-if="canManagePost(post)" class="flex gap-2">
        <NuxtLink :to="`/posts/${post.id}/edit`">
          <UButton size="sm" color="primary" variant="outline">
            编辑
          </UButton>
        </NuxtLink>
        <UButton 
          size="sm" 
          color="error" 
          variant="outline" 
          @click="handleDeletePost(post.id)"
          :loading="isDeleting"
        >
          删除
        </UButton>
      </div>
    </template>
  </UPageCard>
</template>

<script setup lang="ts">
import type { PostModel } from "~/types/post";
import { useDateRelative } from "~/composables/useDateRelative";

// Props
const { post } = defineProps<{
  post: PostModel;
}>();

// Emits
const emit = defineEmits<{
  (_e: "delete", _postId: string): void;
}>();

// Composables
const { currentUser } = useAuth();
const { formatDate } = useDateRelative();

// State
const isDeleting = ref(false);

// Methods
const getPostAuthorName = (post: PostModel): string => {
  // 从expand字段中获取用户信息
  const user = post.expand?.user;
  if (user && "name" in user) {
    return (user.name || user.email.split("@")[0]) as string;
  }
  return "未知用户";
};

const getPostExcerpt = (content: string, maxLength: number = 150): string => {
  // 移除HTML标签（如果有）
  const plainText = content.replace(/<[^>]*>/g, "");
  // 截取指定长度
  if (plainText.length <= maxLength) {
    return plainText;
  }
  return plainText.substring(0, maxLength) + "...";
};

const canManagePost = (post: PostModel): boolean => {
  if (!currentUser.value || !currentUser.value.verified) return false;
  
  // post.user 现在是字符串ID，直接比较
  return post.user === currentUser.value.id;
};

const handleDeletePost = async (postId: string) => {
  try {
    isDeleting.value = true;
    emit("delete", postId);
  } finally {
    isDeleting.value = false;
  }
};
</script>

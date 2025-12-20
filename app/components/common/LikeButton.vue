<template>
  <div
    class="flex items-center justify-center space-x-1.5"
    :class="isLoading ? 'cursor-not-allowed' : 'cursor-pointer'"
    @click="handleLike"
    :disabled="isLoading">
    <!-- 加载图标 -->
    <UIcon
      v-if="isLoading"
      name="hugeicons:refresh"
      class="size-5 text-dimmed animate-spin" />
    <!-- 点赞图标 -->
    <UIcon
      v-else
      :name="liked ? 'hugeicons:heart-check' : 'hugeicons:favourite'"
      :class="[
        'size-5 transition-colors duration-300',
        liked ? 'text-primary' : 'text-dimmed',
        liked && isManualClick ? 'animate-heart-pop' : '',
      ]" />

    <!-- 点赞数动画 -->
    <CommonAnimateNumber
      :value="likes"
      class="tabular-nums text-dimmed" />
  </div>
</template>

<script setup lang="ts">
import type { ToggleLikeResponse } from "~/types/likes";

const props = defineProps<{
  commentId: string;
  initialLikes?: number;
  isLiked?: boolean;
}>();

const emit = defineEmits<{
  (e: "likeChange", liked: boolean, likes: number, commentId: string): void;
}>();

// 获取用户登录状态
const { loggedIn } = useUserSession();

// 状态管理
const likes = ref(props.initialLikes || 0);
const liked = ref(props.isLiked || false);
const isLoading = ref(false);
const isManualClick = ref(false);

// 点赞点击事件处理
const handleLike = async () => {
  // 检查是否登录
  if (!loggedIn.value) {
    // 未登录，跳转到登录页面
    return navigateTo("/auth", { replace: true });
  }

  if (isLoading.value) return;
  isManualClick.value = true;
  isLoading.value = true;

  try {
    // 调用点赞API
    const response = await $fetch<ToggleLikeResponse>("/api/collections/likes", {
      method: "POST",
      body: {
        comment: props.commentId,
      },
    });

    // 更新状态
    liked.value = response.data.liked;
    likes.value = response.data.likes;

    // 触发事件
    emit("likeChange", liked.value, likes.value, props.commentId);
  } catch (error: any) {
    const errorMessage = error.data?.message || "点赞操作失败";
    console.error(errorMessage);
  } finally {
    isLoading.value = false;
    setTimeout(() => {
      isManualClick.value = false;
    }, 1000);
  }
};

// 监听点赞数
watch(
  () => props.initialLikes,
  (newVal) => {
    // 只有当数值真的发生变化时，才更新内部 ref
    if (newVal !== undefined && newVal !== likes.value) {
      likes.value = newVal;
    }
  }
);

// 监听点赞状态
watch(
  () => props.isLiked,
  (newVal) => {
    // 只有当状态真的改变，且不是当前正在手动点击时，才同步
    if (newVal !== undefined && newVal !== liked.value && !isManualClick.value) {
      liked.value = newVal;
    }
  }
);
</script>

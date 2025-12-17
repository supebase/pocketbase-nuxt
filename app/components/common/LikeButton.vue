<template>
  <div
    class="flex items-center justify-center space-x-1.5"
    :class="isLoading ? 'cursor-not-allowed' : 'cursor-pointer'"
    @click="handleLike"
    :disabled="isLoading">
    <!-- 加载图标 -->
    <UIcon
      v-if="isLoading"
      name="svg-spinners:ring-resize"
      class="size-5 text-dimmed" />
    <!-- 点赞图标 -->
    <UIcon
      v-else
      :name="liked ? 'hugeicons:heart-check' : 'hugeicons:favourite'"
      :class="[
        'size-5 transition-colors duration-300',
        liked ? 'text-primary animate-heart-pop' : 'text-dimmed',
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

// 点赞点击事件处理
const handleLike = async () => {
  // 检查是否登录
  if (!loggedIn.value) {
    // 未登录，跳转到登录页面
    return navigateTo("/auth", { replace: true });
  }

  if (isLoading.value) return;

  isLoading.value = true;

  try {
    // 调用点赞API
    const response = await $fetch<ToggleLikeResponse>("/api/likes/records", {
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
    // 显示错误信息
    const errorMessage = error.data?.message || "点赞失败，请稍后重试";
    console.error(errorMessage);
    // 可以添加全局错误提示
  } finally {
    isLoading.value = false;
  }
};
</script>

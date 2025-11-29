<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">发布文章</h1>

    <!-- 未登录或未验证用户的提示 -->
    <UCard v-if="!currentUser || !currentUser.verified" class="p-8 text-center">
      <h2 class="text-xl font-semibold mb-2 text-error">您没有权限发布文章</h2>
      <p class="text-muted-foreground mb-6">只有已验证的用户才能发布文章</p>
      <NuxtLink to="/posts">
        <UButton color="primary">
          返回文章列表
        </UButton>
      </NuxtLink>
    </UCard>

    <!-- 发布文章表单 -->
    <UCard v-else class="overflow-hidden">
      <PostForm
        submit-button-text="发布文章"
        @submit="handleSubmit"
        :error="error" />
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { CreatePostRequest } from "~/types/post";
import type { ApiError } from "~/types/user";

// 应用中间件
definePageMeta({
  middleware: "verified",
});

// Composables
const { createPost } = usePosts();
const { currentUser } = useAuth();
// eslint-disable-next-line no-undef
const { formatErrorMessage } = useErrorHandler();

// State
const error = ref<string | null>(null);

// Methods
const handleSubmit = async (data: CreatePostRequest) => {
  try {
    error.value = null;
    const result = await createPost(data);
    if ("isError" in result) {
      // 显示格式化的错误信息
      error.value = formatErrorMessage(result as ApiError);
    } else {
      // 发布成功，跳转到文章详情页
      navigateTo(`/posts/${result.id}`);
    }
  } catch (err) {
    // 显示捕获到的错误
    error.value = err instanceof Error ? err.message : "发布文章失败";
    console.error("发布文章失败:", err);
  }
};
</script>

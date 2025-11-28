<template>
  <div class="create-post-page">
    <h1>发布文章</h1>

    <!-- 未登录或未验证用户的提示 -->
    <div
      v-if="!currentUser || !currentUser.verified"
      class="unauthorized-state">
      <h2>您没有权限发布文章</h2>
      <p>只有已验证的用户才能发布文章</p>
      <NuxtLink
        to="/posts"
        class="button primary">
        返回文章列表
      </NuxtLink>
    </div>

    <!-- 发布文章表单 -->
    <PostForm
      v-else
      submit-button-text="发布文章"
      @submit="handleSubmit"
      :error="error" />
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

<style scoped>
.create-post-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.create-post-page h1 {
  margin-bottom: 2rem;
  color: #111827;
}

.unauthorized-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.unauthorized-state h2 {
  margin: 0 0 0.5rem;
  color: #dc2626;
}

.unauthorized-state p {
  margin: 0 0 1.5rem;
  color: #6b7280;
}

.button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.button.primary {
  background-color: #3b82f6;
  color: white;
}

.button.primary:hover {
  background-color: #2563eb;
}

@media (max-width: 768px) {
  .create-post-page {
    padding: 1rem;
  }
}
</style>

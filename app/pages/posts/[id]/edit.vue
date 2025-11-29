<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">编辑文章</h1>

    <!-- 加载状态 -->
    <UCard v-if="isLoading" class="p-8 text-center">
      <UProgress size="lg" class="mx-auto mb-4" />
      <p class="text-muted-foreground">加载中...</p>
    </UCard>

    <!-- 错误信息 -->
    <UCard v-else-if="error" class="p-8">
      <UAlert
        color="error"
        variant="soft"
        :title="error"
        class="mb-4" />
      <NuxtLink to="/posts">
        <UButton color="primary"> 返回文章列表 </UButton>
      </NuxtLink>
    </UCard>

    <!-- 未授权状态 -->
    <UCard v-else-if="!canManagePost(post || ({} as PostModel))" class="p-8 text-center">
      <h2 class="text-xl font-semibold mb-2 text-error">您没有权限编辑这篇文章</h2>
      <p class="text-muted-foreground mb-6">只有文章作者才能编辑文章</p>
      <NuxtLink :to="`/posts/${post?.id}`">
        <UButton color="primary">
          返回文章详情
        </UButton>
      </NuxtLink>
    </UCard>

    <!-- 编辑文章表单 -->
    <UCard v-else class="overflow-hidden">
      <PostForm
        :initial-data="{
          title: post?.title ?? '',
          content: post?.content ?? '',
        }"
        submit-button-text="更新文章"
        @submit="handleSubmit"
        :error="formError" />
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { PostModel } from "~/types/post";
import type { UpdatePostRequest } from "~/types/post";
import type { ApiError } from "~/types/user";

// 应用中间件
definePageMeta({
  middleware: "verified",
});

// Composables
const { getPostById, updatePost } = usePosts();
const { currentUser } = useAuth();
// eslint-disable-next-line no-undef
const { formatErrorMessage } = useErrorHandler();

// Params
const route = useRoute();
const postId = route.params.id as string;

// State
const post = ref<PostModel | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const formError = ref<string | null>(null);

// Methods
const fetchPost = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    formError.value = null;
    const result = await getPostById(postId);
    if ("isError" in result) {
      error.value = formatErrorMessage(result as ApiError);
    } else {
      post.value = result;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "获取文章详情失败";
  } finally {
    isLoading.value = false;
  }
};

const canManagePost = (post: PostModel): boolean => {
  if (!currentUser.value || !currentUser.value.verified) return false;

  // post.user 现在是字符串ID，直接比较
  return post.user === currentUser.value.id;
};

const handleSubmit = async (data: UpdatePostRequest) => {
  try {
    formError.value = null;
    const result = await updatePost(postId, data);
    if ("isError" in result) {
      // 显示格式化的错误信息
      formError.value = formatErrorMessage(result as ApiError);
    } else {
      // 更新成功，跳转到文章详情页
      navigateTo(`/posts/${result.id}`);
    }
  } catch (err) {
    // 显示捕获到的错误
    formError.value = err instanceof Error ? err.message : "更新文章失败";
    console.error("更新文章失败:", err);
  }
};

// Lifecycle
onMounted(() => {
  fetchPost();
});
</script>

<style scoped>
.edit-post-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.edit-post-page h1 {
  margin-bottom: 2rem;
  color: #111827;
}

.loading-state,
.error-state,
.unauthorized-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.loading-state {
  color: #6b7280;
  font-size: 1.125rem;
}

.error-state {
  color: #dc2626;
}

.error-state p {
  margin-bottom: 1.5rem;
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
  .edit-post-page {
    padding: 1rem;
  }
}
</style>

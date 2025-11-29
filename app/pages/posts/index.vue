<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- 页面头部 -->
    <div class="flex justify-between items-center mb-8 flex-wrap gap-4">
      <h1 class="text-3xl font-bold">文章列表</h1>
      <div class="flex items-center gap-4">
        <NuxtLink
          v-if="currentUser && currentUser.verified"
          to="/posts/create"
        >
          <UButton color="primary" variant="solid" size="lg">
            发布文章
          </UButton>
        </NuxtLink>
        <div
          v-else
          class="text-sm text-muted-foreground">
          只有已验证的用户才能发布文章
        </div>
      </div>
    </div>

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
        class="mb-4"
      />
      <UButton @click="fetchPosts" color="secondary" variant="outline">
        重试
      </UButton>
    </UCard>

    <!-- 文章列表 -->
    <UPageList v-else-if="posts.length > 0">
      <PostCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
        @delete="handleDeletePost" />
    </UPageList>

    <!-- 空状态 -->
    <UCard v-else class="p-8 text-center">
      <h3 class="text-xl font-semibold mb-2">暂无文章</h3>
      <p class="text-muted-foreground mb-6">快来发布第一篇文章吧！</p>
      <NuxtLink
        v-if="currentUser && currentUser.verified"
        to="/posts/create"
      >
        <UButton color="primary">
          发布文章
        </UButton>
      </NuxtLink>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { PostModel } from "~/types/post";

// Composables
const { getPosts, deletePost } = usePosts();
const { currentUser } = useAuth();

// State
const posts = ref<PostModel[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Methods
const fetchPosts = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    const result = await getPosts();
    if ("isError" in result) {
      error.value = result.message;
    } else {
      posts.value = result;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "获取文章列表失败";
  } finally {
    isLoading.value = false;
  }
};

const handleDeletePost = async (postId: string) => {
  try {
    const result = await deletePost(postId);
    if (result && typeof result === "object" && "isError" in result) {
      error.value = result.message;
    } else {
      // 从列表中移除删除的文章
      posts.value = posts.value.filter((post) => post.id !== postId);
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "删除文章失败";
  }
};

// Lifecycle
onMounted(() => {
  fetchPosts();
});
</script>

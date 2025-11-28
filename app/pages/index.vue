<template>
  <div class="home-page max-w-7xl mx-auto px-4 py-8">
    <!-- 英雄区域 -->
    <UCard class="mb-8 overflow-hidden">
      <div class="bg-linear-to-r from-primary-500 to-primary-600 text-white p-8">
        <h1 class="text-3xl font-bold mb-3">欢迎来到我们的社区</h1>
        <p class="text-lg mb-6 opacity-90">分享你的想法，交流你的经验，与志同道合的人一起成长</p>
        <div class="flex gap-4 flex-wrap">
          <NuxtLink to="/posts">
            <UButton color="primary" variant="solid" size="lg">
              浏览文章
            </UButton>
          </NuxtLink>
          <NuxtLink v-if="currentUser && currentUser.verified" to="/posts/create">
            <UButton color="secondary" variant="solid" size="lg">
              发布文章
            </UButton>
          </NuxtLink>
        </div>
      </div>
    </UCard>

    <!-- 文章列表 -->
    <div class="posts-section mb-8">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">最新文章</h2>
        <NuxtLink to="/posts" class="text-primary-600 hover:text-primary-800 font-medium">
          查看全部 →
        </NuxtLink>
      </div>

      <!-- 加载状态 -->
      <UCard v-if="isLoading" class="p-8 text-center">
        <UProgress size="lg" class="mx-auto mb-4" />
        <p class="text-gray-500">加载中...</p>
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
      <div v-else-if="posts.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <PostCard
          v-for="post in posts"
          :key="post.id"
          :post="post"
          @delete="handleDeletePost"
        />
      </div>

      <!-- 空状态 -->
      <UCard v-else class="p-8 text-center">
        <h3 class="text-xl font-semibold mb-2">暂无文章</h3>
        <p class="text-gray-500 mb-6">快来发布第一篇文章吧！</p>
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
      // 只显示最新的6篇文章
      posts.value = result.slice(0, 6);
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
    if (typeof result === 'object' && result !== null && "isError" in result) {
      error.value = result.message;
    } else {
      // 从列表中移除删除的文章
      posts.value = posts.value.filter(post => post.id !== postId);
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
<template>
  <div class="posts-page">
    <div class="page-header">
      <h1>文章列表</h1>
      <NuxtLink
        v-if="currentUser && currentUser.verified"
        to="/posts/create"
        class="button primary">
        发布文章
      </NuxtLink>
      <div
        v-else
        class="unverified-message">
        只有已验证的用户才能发布文章
      </div>
    </div>

    <!-- 加载状态 -->
    <div
      v-if="isLoading"
      class="loading-state">
      加载中...
    </div>

    <!-- 错误信息 -->
    <div
      v-else-if="error"
      class="error-state">
      <p>{{ error }}</p>
      <button
        @click="fetchPosts"
        class="button secondary">
        重试
      </button>
    </div>

    <!-- 文章列表 -->
    <div
      v-else-if="posts.length > 0"
      class="posts-grid">
      <PostCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
        @delete="handleDeletePost" />
    </div>

    <!-- 空状态 -->
    <div
      v-else
      class="empty-state">
      <h2>暂无文章</h2>
      <p>快来发布第一篇文章吧！</p>
      <NuxtLink
        v-if="currentUser && currentUser.verified"
        to="/posts/create"
        class="button primary">
        发布文章
      </NuxtLink>
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

<style scoped>
.posts-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-header h1 {
  margin: 0;
  font-size: 2rem;
  color: #111827;
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

.button.secondary {
  background-color: #e5e7eb;
  color: #374151;
}

.button.secondary:hover {
  background-color: #d1d5db;
}

.unverified-message {
  color: #6b7280;
  font-size: 0.875rem;
}

.loading-state,
.error-state,
.empty-state {
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
  margin-bottom: 1rem;
}

.empty-state h2 {
  margin: 0 0 0.5rem;
  color: #111827;
}

.empty-state p {
  margin: 0 0 1.5rem;
  color: #6b7280;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
}

@media (max-width: 768px) {
  .posts-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .posts-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>

<template>
  <div class="home-page max-w-7xl mx-auto px-4 py-8">


    <!-- 文章列表 -->
    <div class="posts-section mb-8">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">最新文章</h2>
        <NuxtLink to="/posts" class="text-primary hover:text-primary-600 font-medium">
          查看全部 →
        </NuxtLink>
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
      <UPageColumns v-else-if="posts.length > 0">
        <PostCard
          v-for="post in posts"
          :key="post.id"
          :post="post"
          @delete="handleDeletePost"
        />
      </UPageColumns>

      <!-- 空状态 -->
      <UEmpty
        v-else
        icon="i-lucide-file-text"
        title="暂无文章"
        description="登录并验证邮箱后即可发布文章，分享你的想法和经验！"
        :actions="currentUser && currentUser.verified ? [
          {
            icon: 'i-lucide-plus',
            label: '发布文章',
            color: 'primary',
            variant: 'solid',
            to: '/posts/create'
          }
        ] : []"
      />
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
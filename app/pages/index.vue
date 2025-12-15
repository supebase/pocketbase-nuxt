<template>
  <div>
    <div class="posts-container">
      <h2>文章列表</h2>

      <div
        v-if="pending"
        class="loading">
        加载中...
      </div>

      <div
        v-else-if="error"
        class="error">
        加载失败：{{ error.message }}
      </div>

      <div
        v-else-if="posts.length === 0"
        class="empty">
        暂无文章
      </div>

      <div
        v-else
        class="posts-list">
        <div
          v-for="post in posts"
          :key="post.id"
          class="post-item">
          <div class="post-header">
            <h3 class="post-title">{{ post.content }}</h3>
            <div class="space-x-3">
              <span class="post-author">{{ post.expand?.user?.name }}</span>
              <span class="post-date">{{ formatDate(post.created) }}</span>
              <span v-if="post.allow_comment" class="text-green-500">允许评论</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 定义 Post 类型
interface Post {
  id: string;
  content: string;
  allow_comment: boolean;
  created: string;
  expand?: {
    user?: {
      name?: string;
    };
  };
}

const { data, pending, error } = await useFetch<{
  message: string;
  data: {
    posts: Post[];
    totalItems: number;
    page: number;
    perPage: number;
  };
}>("/api/posts/records");

const posts = computed(() => data.value?.data?.posts || []);

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
</script>

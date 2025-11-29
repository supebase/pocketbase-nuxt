<template>
  <div class="post-detail-page max-w-4xl mx-auto px-4 py-8">
    <!-- 加载状态 -->
    <UCard
      v-if="isLoading"
      class="p-8 text-center">
      <UProgress
        size="lg"
        class="mx-auto mb-4" />
      <p class="text-gray-500">加载中...</p>
    </UCard>

    <!-- 错误信息 -->
    <UCard
      v-else-if="error"
      class="p-8">
      <UAlert
        color="error"
        variant="soft"
        :title="error"
        class="mb-4" />
      <NuxtLink to="/posts">
        <UButton color="primary"> 返回文章列表 </UButton>
      </NuxtLink>
    </UCard>

    <!-- 文章详情 -->
    <UCard
      v-else
      class="overflow-hidden">
      <!-- 文章头部 -->
      <div class="p-6">
        <h1 class="text-3xl font-bold mb-4 text-gray-800">{{ post?.title }}</h1>
        <div class="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
          <div class="flex items-center gap-1">
            <span class="font-medium">作者：</span>
            {{ getPostAuthorName(post || ({} as PostModel)) }}
          </div>
          <div class="flex items-center gap-1">
            <span class="font-medium">发布时间：</span>
            {{ formatDate(post?.created || "") }}
          </div>
          <div
            v-if="post?.created !== post?.updated"
            class="flex items-center gap-1">
            <span class="font-medium">更新时间：</span>
            {{ formatDate(post?.updated || "") }}
          </div>
        </div>
        <div class="flex gap-3 mb-6">
          <NuxtLink
            v-if="canManagePost(post || {} as PostModel)"
            :to="`/posts/${post?.id}/edit`">
            <UButton
              color="primary"
              variant="outline">
              编辑文章
            </UButton>
          </NuxtLink>
          <UButton
            v-if="canManagePost(post || {} as PostModel)"
            color="error"
            variant="outline"
            @click="handleDeletePost"
            :loading="isDeleting">
            删除文章
          </UButton>
        </div>
      </div>

      <!-- 文章内容 -->
      <div class="p-6 pt-0 prose max-w-none">
        {{ post?.content }}
      </div>

      <!-- 评论区 -->
      <div class="p-6 border-t">
        <!-- 评论列表 -->
        <CommentList
          :comments="comments"
          @delete="handleDeleteComment" />

        <!-- 发布评论表单 -->
        <CommentForm
          v-if="currentUser"
          :post-id="post?.id || ''"
          @submit="handleSubmitComment" />
        <UAlert
          v-else
          color="warning"
          variant="soft"
          title="只有已验证的用户才能发布评论"
          class="mt-4" />
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { PostModel } from "~/types/post";
import type { CommentModel } from "~/types/comment";
import type { CreateCommentRequest } from "~/types/comment";
import { useDateRelative } from "~/composables/useDateRelative";

// Composables
const { getPostById, deletePost } = usePosts();
const { getCommentsByPostId, createComment, deleteComment } = useComments();
const { currentUser } = useAuth();
const { formatDate } = useDateRelative();

// Params
const route = useRoute();
const postId = route.params.id as string;

// State
const post = ref<PostModel | null>(null);
const comments = ref<CommentModel[]>([]);
const isLoading = ref(true);
const isDeleting = ref(false);
const error = ref<string | null>(null);

// Methods
const fetchPost = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    const result = await getPostById(postId);
    if ("isError" in result) {
      error.value = result.message;
    } else {
      post.value = result;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "获取文章详情失败";
  } finally {
    isLoading.value = false;
  }
};

const fetchComments = async () => {
  try {
    const result = await getCommentsByPostId(postId);
    if (!("isError" in result)) {
      comments.value = result;
    }
  } catch (err) {
    console.error("获取评论失败:", err);
  }
};

const getPostAuthorName = (post: PostModel): string => {
  // 从expand字段中获取用户信息
  const user = post.expand?.user;
  if (user && "name" in user && user.email) {
    return (user.name as string) || (user.email.split("@")[0] as string);
  }
  return "未知用户";
};

const canManagePost = (post: PostModel): boolean => {
  if (!currentUser.value || !currentUser.value.verified) return false;

  // post.user 现在是字符串ID，直接比较
  return post.user === currentUser.value.id;
};

const handleDeletePost = async () => {
  if (!post.value) return;

  try {
    isDeleting.value = true;
    const result = await deletePost(post.value.id);
    if (typeof result === "object" && result !== null && "isError" in result) {
      error.value = result.message;
    } else {
      // 删除成功，跳转到文章列表
      navigateTo("/posts");
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "删除文章失败";
  } finally {
    isDeleting.value = false;
  }
};

const handleSubmitComment = async (data: CreateCommentRequest) => {
  try {
    const result = await createComment(data);
    if (typeof result === "object" && result !== null && !("isError" in result)) {
      // 评论成功，重新获取评论列表
      await fetchComments();
    }
  } catch (err) {
    console.error("发布评论失败:", err);
  }
};

const handleDeleteComment = async (commentId: string) => {
  try {
    const result = await deleteComment(commentId);
    if (typeof result === "object" && result !== null && !("isError" in result)) {
      // 删除成功，从列表中移除评论
      comments.value = comments.value.filter((comment) => comment.id !== commentId);
    }
  } catch (err) {
    console.error("删除评论失败:", err);
  }
};

// Lifecycle
onMounted(() => {
  fetchPost();
  fetchComments();
});
</script>

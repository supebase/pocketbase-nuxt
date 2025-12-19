<template>
  <div class="mt-6">
    <div
      v-if="loading && comments.length === 0"
      class="flex justify-center py-8">
      <UIcon
        name="svg-spinners:ring-resize"
        class="size-7 text-primary" />
    </div>

    <div v-else-if="comments.length > 0">
      <USeparator
        type="dashed"
        class="mb-6">
        <div class="text-dimmed">评论</div>
        <CommonAnimateNumber
          :value="comments.length"
          class="text-dimmed mx-1.5" />
        <div class="text-dimmed">条</div>
      </USeparator>

      <CommonMotionTimeline
        :items="comments"
        line-offset="15px"
        :trigger-ratio="0.55">
        <template #indicator="{ item }">
          <div
            class="size-8 rounded-full ring-4 ring-white dark:ring-neutral-900 shadow-sm overflow-hidden">
            <CommonGravatar
              :avatar-id="item.expand?.user?.avatar"
              :size="64" />
          </div>
        </template>

        <template #title="{ item }">
          <div class="flex items-center justify-between text-base font-medium">
            {{ item.expand?.user?.name }}
            <CommonLikeButton
              :comment-id="String(item.id)"
              :initial-likes="item.likes || 0"
              :is-liked="item.isLiked || false" />
          </div>
        </template>

        <template #description="{ item }">
          <div class="text-base break-all whitespace-pre-wrap">{{ item.comment }}</div>
          <div class="text-sm text-dimmed mt-1.5">{{ item.relativeTime }}</div>
        </template>
      </CommonMotionTimeline>

      <USeparator
        label="已经到底了"
        type="dashed"
        class="mt-8" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CommentRecord } from "~/types/comments";

const toast = useToast();

const props = defineProps<{ postId: string; allowComment: boolean }>();
const emit = defineEmits(["loading-change", "update-commenters"]);

const comments = ref<CommentRecord[]>([]);
const loading = ref(false);

/**
 * 核心请求方法
 * @param isSilent 是否静默刷新（不触发全屏Loading）
 */
const fetchComments = async (isSilent = false) => {
  if (!isSilent) loading.value = true;
  try {
    const res = await $fetch<any>(`/api/comments/records`, {
      query: {
        filter: `post="${props.postId}"`,
        sort: "-created",
      },
    });

    const rawComments = res.data?.comments || [];
    comments.value = rawComments.map((c: any) => ({
      ...c,
      relativeTime: useRelativeTime(c.created).value,
    }));

    emit("update-commenters", comments.value);
  } catch (err) {
    console.error("Fetch comments failed:", err);
  } finally {
    loading.value = false;
  }
};

/**
 * 按需刷新逻辑：检查后端 totalItems 与本地数量是否一致
 */
const checkAndRefresh = async () => {
  // 如果当前没数据，直接拉取
  if (comments.value.length === 0) {
    return fetchComments();
  }

  try {
    // 发起一个只为了拿 totalItems 的轻量请求 (只请求 1 条数据)
    const res = await $fetch<any>(`/api/comments/records`, {
      query: {
        filter: `post="${props.postId}"`,
        perPage: 1,
      },
    });

    const serverTotal = res.data?.totalItems || 0;
    const localTotal = comments.value.length;

    // 如果总数不对，说明有增删，执行静默刷新
    if (serverTotal !== localTotal) {
      toast.add({
        title: "发现评论有更新",
        description: `目前有 ${localTotal} 条评论，最新记录 ${serverTotal} 条。正在刷新...`,
        icon: "hugeicons:comment-02",
        color: "info",
      });
      await fetchComments(true);
    }
  } catch (e) {
    console.warn("Check updates failed", e);
  }
};

/**
 * 供父组件调用：创建成功后直接 UI 插入
 */
const handleCommentCreated = (newComment: CommentRecord) => {
  const formatted: CommentRecord = {
    ...newComment,
    relativeTime: "刚刚",
    likes: 0,
    isLiked: false,
    isNew: true,
  };
  comments.value.unshift(formatted);
  emit("update-commenters", comments.value);
};

defineExpose({ handleCommentCreated });

// 初次挂载
onMounted(() => {
  fetchComments();
});

// KeepAlive 恢复时调用
onActivated(() => {
  checkAndRefresh();
  // 即使没更新，也告知父组件当前有哪些人，防止父组件因为切换页面丢失状态
  emit("update-commenters", comments.value);
});

watch(loading, (val) => emit("loading-change", val));
</script>

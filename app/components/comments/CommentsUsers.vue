<template>
  <div ref="target" class="flex mt-2.5 h-6">
    <div v-if="status === 'pending' && totalCount === 0" class="flex items-center">
      <UIcon name="i-hugeicons:refresh" class="size-5 text-dimmed animate-spin" />
    </div>

    <template v-else-if="totalCount > 0">
      <div class="flex items-center">
        <div class="flex -space-x-1 overflow-hidden">
          <div
            v-for="(avatar, index) in avatarList"
            :key="avatar"
            class="inline-block size-5.5 rounded-full ring-2 ring-white dark:ring-neutral-900 overflow-hidden"
            :style="{ zIndex: 10 - (index as number) }"
          >
            <CommonGravatar :avatar-id="avatar" :size="32" />
          </div>
        </div>

        <UBadge
          v-if="totalCount > 1"
          variant="soft"
          size="sm"
          color="neutral"
          class="rounded-xl text-muted text-xs ml-1.5 px-1.5"
        >
          +{{ totalCount }}
        </UBadge>

        <span class="text-sm font-medium text-dimmed ml-2 truncate max-w-40">
          {{ !allowComment ? '评论已关闭' : totalCount === 1 ? `${lastUserName} 发表了评论` : '参与了评论' }}
        </span>
      </div>
    </template>

    <div v-else class="flex items-center gap-2 text-sm text-dimmed">
      <UIcon :name="!allowComment ? 'i-hugeicons:comment-block-02' : 'i-hugeicons:comment-02'" class="size-4.5" />
      <span class="text-sm">{{ !allowComment ? '评论已关闭' : '暂无评论' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core';

const props = defineProps({
  postId: { type: String, required: true },
  allowComment: { type: Boolean, default: true },
});

const target = ref(null);
const isRendered = ref(false);

// 1. 视口监听 (保持不变)
const { stop } = useIntersectionObserver(target, ([entry]) => {
  if (entry?.isIntersecting) {
    isRendered.value = true;
    stop(); // 触发后停止监听
  }
});

// 2. 数据获取：直接请求 View 集合
const {
  data: statsResponse, // 注意：后端返回了 { data: ... } 结构
  status,
  refresh,
} = await useLazyFetch<any>(`/api/collections/comment/${props.postId}`, {
  key: `comment-stats-${props.postId}`,
  immediate: false,
  watch: [isRendered],
});

// 3. 借壳监听 Realtime (核心改进)
const { listen, close } = usePocketRealtime();
let debounceTimer: any;

const setupRealtime = () => {
  if (import.meta.server) return;

  listen(({ collection, record }) => {
    // 逻辑：如果有人评论了这篇文章，且当前小部件已经出现在视口中
    if (collection === 'comments' && record.post === props.postId && isRendered.value) {
      // 防抖处理：防止多人同时评论时短时间内触发大量 API 请求
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        refresh();
      }, 500);
    }
  });
};

onMounted(() => {
  setupRealtime();
});

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer);
  close(); // 必须调用，移除当前组件在 sseManager 中的 callback
});

// 4. 数据解析
const stats = computed(() => statsResponse.value?.data);
const avatarList = computed(() => stats.value?.user_avatars?.split(',').filter(Boolean) || []);
const lastUserName = computed(() => stats.value?.last_user_name || '');
const totalCount = computed(() => stats.value?.total_items || 0);
</script>

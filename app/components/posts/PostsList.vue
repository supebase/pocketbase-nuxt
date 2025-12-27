<template>
  <div class="flex flex-col items-center justify-center select-none">
    <div v-if="status !== 'pending' || isRefreshing || !error"
      class="flex items-center justify-center w-full gap-3">
      <div class="flex items-center gap-1 text-base tracking-widest text-dimmed font-semibold">
        <ClientOnly>
          <CommonAnimateNumber :value="visibleTotalItems" /> 条内容
          <template #fallback>
            <span>0 条内容</span>
          </template>
        </ClientOnly>
      </div>
      <UIcon v-if="isRefreshing" name="i-hugeicons:refresh"
        class="size-4 text-dimmed cursor-not-allowed animate-spin" />
      <UIcon v-else-if="allPosts.length > 0" name="i-hugeicons:refresh"
        class="size-4 text-dimmed cursor-pointer hover:text-primary transition-colors"
        @click="manualRefresh" />
    </div>

    <UAlert v-if="error" :description="error.data?.message || '获取列表失败，请检查网络连接'" variant="soft"
      icon="i-hugeicons:alert-02" color="error" class="mt-4" />

    <div v-else class="mt-8 space-y-4 w-full">
      <ClientOnly>
        <template v-if="allPosts.length === 0 && status !== 'pending' && !isRefreshing">
          <div
            class="flex flex-col items-center justify-center space-y-4 min-h-[calc(100vh-14rem)] pt-16">
            <UEmpty variant="naked" title="糟糕！空空如也～" description="您可以点击刷新按钮尝试获取最新的数据" :actions="[
              {
                label: '刷新',
                color: 'neutral',
                loadingAuto: true,
                class: 'cursor-pointer',
                onClick: manualRefresh,
              },
            ]" />
          </div>
        </template>

        <template v-else>
          <CommonMotionTimeline :items="displayItems" :key="refreshCounter"
            :loading-more="isLoadingMore" line-offset="15px" :trigger-ratio="0.55"
            :is-resetting="isResetting">
            <template #indicator="{ item }">
              <div v-if="item.icon"
                class="flex items-center justify-center size-8 rounded-full bg-white dark:bg-neutral-900 ring-3 ring-white dark:ring-neutral-900 shadow-sm overflow-hidden">
                <UIcon :name="item.icon" class="size-6 text-primary" />
              </div>
              <CommonGravatar v-else :avatar-id="item.avatarId" :size="64" />
            </template>

            <template #title="{ item }">
              <div class="flex items-center gap-3">
                <div class="text-base">{{ item.title }}</div>
                <div v-if="!item.published && canViewDrafts" class="text-warning">待发布稿</div>
                <UBadge v-else-if="item.action === 'dit'" label="DIRE" variant="outline"
                  size="sm" />
                <UBadge v-else label="PARTAGER" variant="outline" size="sm" />
              </div>
            </template>

            <template #date="{ item }">
              <div class="flex items-center gap-2.5">
                <span class="text-dimmed/80">{{ item.date }}</span>
                <PostsDelete :item="item" :can-view-drafts="canViewDrafts ?? false" />
              </div>
            </template>

            <template #description="{ item, index }">
              <PostsItem :item="item" :delay="index % 10 * 0.08"
                :can-view-drafts="canViewDrafts ?? false" />
            </template>
          </CommonMotionTimeline>
        </template>

        <div v-if="allPosts.length > 0" class="flex flex-col items-center justify-center mt-8 mb-4">
          <Transition name="fade" mode="out-in">
            <div v-if="hasMore" key="load-button">
              <UButton loading-auto variant="soft" color="neutral" class="cursor-pointer px-8"
                @click="handleLoadMore">
                {{ isLoadingMore ? '努力加载中...' : '加载更多' }}
              </UButton>
            </div>
            <div v-else key="no-more" class="w-full">
              <USeparator label="已经到底了" type="dashed" class="text-dimmed opacity-60" />
            </div>
          </Transition>

          <SkeletonPosts v-if="isLoadingMore" :count="1" class="opacity-60 mt-4 w-full" />
        </div>

        <template #fallback>
          <div class="space-y-8 w-full">
            <SkeletonPosts :count="3" class="opacity-70 mask-b-from-10" />
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PostsResponse, UsersResponse, TypedPocketBase } from '~/types/pocketbase-types';
import type { PostsListResponse } from '~/types/posts';

// --- 1. 类型定义 ---
type PostWithUser = PostsResponse<{ user: UsersResponse }> & {
  cleanContent?: string // 💡 扩展字段
}

// --- 2. 状态与认证 ---
const { loggedIn, user } = useUserSession();
const { isRefreshing, isResetting, refreshPostsAndComments } = useRefresh();

// --- 3. 分页逻辑 ---
const {
  allItems: allPosts,
  currentPage,
  totalItems,
  isLoadingMore,
  hasMore,
  loadMore,
  resetPagination,
} = usePagination<PostWithUser>();

// --- 4. 实时订阅 ---
const { stream } = usePocketRealtime<PostWithUser>('posts');

// --- 5. 获取数据的 API 包装 ---
const fetchPostsApi = async (page: number) => {
  const res = await $fetch<PostsListResponse>('/api/collections/posts', { query: { page } });
  return {
    items: res.data.posts as PostWithUser[],
    total: res.data.totalItems
  };
};

// --- 6. SSR 初始加载 ---
const { data: fetchResult, status, error, refresh } = await useLazyFetch<PostsListResponse>('/api/collections/posts', {
  key: 'posts-list-data',
  server: true,
});

const transformPosts = (items: PostWithUser[]) => {
  return items.map(item => ({
    ...item,
    cleanContent: cleanMarkdown(item.content) // 💡 预先清洗
  }));
};

// 监听 SSR 结果并同步到分页 Hook
watch(fetchResult, (res) => {
  if (res?.data && res.data.page === 1) {
    // 💡 传入 transformPosts
    resetPagination(res.data.posts as PostWithUser[], res.data.totalItems, transformPosts);
  }
}, { immediate: true });

// --- 7. 计算属性 ---
const canViewDrafts = computed(() => loggedIn.value && user.value?.verified);

const refreshCounter = ref(0);

// 优化后的 displayItems：将内容清洗逻辑也包含在内
const displayItems = computed(() => {
  const filtered = canViewDrafts.value ? allPosts.value : allPosts.value.filter(p => p.published);

  return filtered
    .slice()
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
    .map((item) => ({
      id: item.id,
      title: item.expand?.user?.name || '未知用户',
      date: useRelativeTime(item.created).value,
      cleanContent: item.cleanContent,
      action: item.action,
      allowComment: item.allow_comment,
      published: item.published,
      icon: item.icon,
      avatarId: item.expand?.user?.avatar,
      firstImage: getFirstImageUrl(item.content),
      link_data: item.link_data,
    }));
});

const visibleTotalItems = computed(() =>
  canViewDrafts.value ? totalItems.value : allPosts.value.filter(p => p.published).length
);

// --- 8. 实时流逻辑 ---
// --- 8. 实时流逻辑 ---
onMounted(async () => {
  await stream({
    expand: 'user',
    // 💡 这里的 fields 过滤可以极大减少 markdown 传输压力
    fields: 'id,content,action,published,created,allow_comment,icon,expand.user.name,expand.user.avatar,link_data',
    onUpdate: ({ action, record }) => {
      // 这里的 record 已经是 usePocketRealtime 补全后的 fullRecord
      const idx = allPosts.value.findIndex(p => p.id === record.id);
      const isVisible = record.published || canViewDrafts.value;

      if (action === 'delete') {
        if (idx !== -1) {
          allPosts.value.splice(idx, 1);
          totalItems.value = Math.max(0, totalItems.value - 1);
        }
        return;
      }

      // 预清洗内容
      const processedRecord = {
        ...record,
        cleanContent: cleanMarkdown(record.content)
      };

      if (action === 'create') {
        if (isVisible && idx === -1) {
          allPosts.value.unshift(processedRecord);
          totalItems.value++;
        }
      } else if (action === 'update') {
        if (!isVisible && idx !== -1) {
          // 如果更新后变为不可见（如取消发布），从本地列表移除
          allPosts.value.splice(idx, 1);
          totalItems.value--;
        } else if (isVisible) {
          if (idx !== -1) {
            // 直接替换对象，确保响应式更新
            allPosts.value[idx] = processedRecord;
          } else {
            // 如果原本不可见现在可见了，新增进去
            allPosts.value.unshift(processedRecord);
            totalItems.value++;
          }
        }
      }
    }
  });
});

const manualRefresh = async () => {
  await refreshPostsAndComments(refresh, allPosts, currentPage);
  refreshCounter.value++; // 改变 key，强制销毁并重建列表组件，触发子组件重新 Fetch
};

const handleLoadMore = () => loadMore(fetchPostsApi, transformPosts);
</script>
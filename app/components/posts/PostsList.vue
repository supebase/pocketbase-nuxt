<template>
  <div class="flex flex-col items-center justify-center select-none">
    <PostsHeader
      v-if="status !== 'pending' || isRefreshing || !error"
      :count="visibleTotalItems"
      :isRefreshing="isRefreshing"
      :length="allPosts.length"
      :is-login="loggedIn"
      :user-verified="user?.verified"
      @refresh="manualRefresh"
    />

    <UAlert
      v-if="error"
      :description="error.data?.message || '获取列表失败，请检查网络连接'"
      variant="soft"
      icon="i-hugeicons:alert-02"
      color="error"
      class="mt-6"
    />

    <div v-else class="mt-10 space-y-4 w-full">
      <ClientOnly>
        <PostsEmptyState
          v-if="allPosts.length === 0 && status !== 'pending' && !isRefreshing"
          @refresh="manualRefresh"
        />

        <template v-else>
          <CommonMotionTimeline
            :items="displayItems"
            :loading-more="isLoadingMore"
            line-offset="15px"
            :trigger-ratio="0.55"
            :is-resetting="isResetting"
          >
            <template #indicator="{ item }">
              <div
                v-if="item.icon"
                class="flex items-center justify-center size-8 rounded-full bg-white dark:bg-neutral-900 overflow-hidden"
              >
                <UIcon :name="item.icon" class="size-6 text-primary" />
              </div>
              <CommonGravatar v-else :avatar-id="item.avatarId" :size="64" />
            </template>

            <template #title="{ item }">
              <div class="flex items-center gap-3">
                <div class="text-base">
                  {{ item.icon ? formatIconName(item.icon) : item.title }}
                </div>
                <div v-if="!item.published && canViewDrafts" class="text-warning">待发布稿</div>
                <UBadge
                  v-else-if="item.action === 'dit'"
                  label="DIRE"
                  variant="outline"
                  color="neutral"
                  size="sm"
                  class="text-dimmed"
                />
                <UBadge v-else label="PARTAGER" variant="outline" color="neutral" size="sm" class="text-dimmed" />
              </div>
            </template>

            <template #date="{ item }">
              <div class="flex items-center gap-2.5">
                <span class="text-dimmed">{{ item.date }}</span>
                <PostsMenu
                  :is-logined="loggedIn"
                  :item="item"
                  :can-view-drafts="canViewDrafts ?? false"
                  @request-delete="handleRequestDelete"
                />
              </div>
            </template>

            <template #description="{ item, index }">
              <PostsItem
                :item="item"
                :delay="(index % 10) * 0.08"
                :can-view-drafts="canViewDrafts ?? false"
                :trigger-animation="animationTrigger"
              />
            </template>
          </CommonMotionTimeline>

          <ModalDelete v-model:open="isDeleteModalOpen" :loading="isDeleting" @confirm="confirmDelete">
            <div v-if="pendingDeleteItem" class="flex flex-col gap-2">
              <div class="text-sm text-primary font-semibold tracking-wider">即将消失的数据</div>
              <div class="text-sm text-muted line-clamp-2">
                {{ pendingDeleteItem.cleanContent }}
              </div>
            </div>
          </ModalDelete>
        </template>

        <div v-if="allPosts.length > 0" class="flex flex-col items-center justify-center mb-4 min-h-15">
          <Transition name="fade" mode="out-in">
            <div v-if="hasMore && !isLoadingMore" key="load-button mt-8">
              <UButton variant="soft" color="neutral" class="cursor-pointer px-8" @click="handleLoadMore">
                加载更多
              </UButton>
            </div>

            <div v-else-if="isLoadingMore" key="loading" class="w-full">
              <SkeletonPosts :count="1" class="w-full mask-b-from-10" />
            </div>

            <div v-else key="no-more" class="w-full">
              <USeparator label="已经到底了" type="dashed" class="text-dimmed opacity-60" />
            </div>
          </Transition>
        </div>

        <template #fallback>
          <div class="space-y-8 w-full">
            <SkeletonPosts :count="3" class="mask-b-from-10 animate-pulse" />
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PostWithUser, PostsListResponse } from '~/types/posts';

// 1. 获取核心状态
const {
  allPosts,
  displayItems,
  totalItems,
  currentPage,
  isLoadingMore,
  hasMore,
  isInitialLoaded,
  isResetting,
  canViewDrafts,
  setupRealtime,
  close,
  loadMore,
  resetPagination,
  transformPosts,
} = usePosts();

const { loggedIn, user } = useUserSession();
const { isRefreshing, refreshPostsAndComments } = useRefresh();
const toast = useToast();

// 2. 数据获取
const {
  data: fetchResult,
  status,
  error,
  refresh,
} = await useLazyFetch<PostsListResponse>('/api/collections/posts', {
  key: 'posts-list-data',
  server: true,
  watch: [loggedIn],
});

// 3. 抽离的 Action 逻辑
const { isDeleteModalOpen, isDeleting, pendingDeleteItem, handleRequestDelete, confirmDelete } =
  usePostsActions(refresh);

// 4. 私有 UI 状态
const animationTrigger = ref(0);
const refreshCounter = ref(0);

const visibleTotalItems = computed(() => totalItems.value);

// 5. 监听与生命周期
watch(
  fetchResult,
  (res) => {
    if (res?.data && res.data.page === 1) {
      if (allPosts.value.length === 0) {
        animationTrigger.value++;
      }

      resetPagination(res.data.posts as PostWithUser[], res.data.totalItems, transformPosts);
      isInitialLoaded.value = true;
    }
  },
  { immediate: true },
);

onMounted(() => setupRealtime());
onUnmounted(() => close());

// 6. 交互方法
const manualRefresh = async () => {
  isResetting.value = true;
  const persistedProgress = useState<number>('timeline-progress-15px');
  persistedProgress.value = 0;

  try {
    await refreshPostsAndComments(refresh, allPosts, currentPage);
    refreshCounter.value++;
    animationTrigger.value++;
  } finally {
    nextTick(() => {
      setTimeout(() => {
        isResetting.value = false;
      }, 100);
    });

    toast.add({
      title: '刷新完成',
      description: `共刷新了 ${visibleTotalItems.value} 项内容`,
      icon: 'i-hugeicons:checkmark-circle-03',
      color: 'success',
    });
  }
};

const handleLoadMore = () =>
  loadMore(async (nextPage) => {
    const res = await $fetch<PostsListResponse>('/api/collections/posts', {
      query: { page: nextPage },
    });

    return {
      items: res.data.posts as PostWithUser[],
      total: res.data.totalItems,
    };
  });
</script>

<template>
  <div class="flex flex-col items-center justify-center select-none">
    <PostsHeader
      v-if="status !== 'pending' || isRefreshing || !error"
      :count="visibleTotalItems"
      :isRefreshing="isRefreshing"
      :length="allPosts.length"
      @refresh="manualRefresh"
    />

    <UAlert
      v-if="error"
      :description="error.data?.message || '获取列表失败，请检查网络连接'"
      variant="soft"
      icon="i-hugeicons:alert-02"
      color="error"
      class="mt-4"
    />

    <div v-else class="mt-8 space-y-4 w-full">
      <ClientOnly>
        <template v-if="allPosts.length === 0 && status !== 'pending' && !isRefreshing">
          <div
            class="flex flex-col items-center justify-center space-y-4 min-h-[calc(100vh-14rem)] pt-16"
          >
            <UEmpty
              variant="naked"
              title="糟糕！空空如也～"
              description="您可以点击刷新按钮尝试获取最新的数据"
              :actions="[
                {
                  label: '刷新',
                  color: 'neutral',
                  loadingAuto: true,
                  class: 'cursor-pointer',
                  onClick: manualRefresh,
                },
              ]"
            />
          </div>
        </template>

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
                <div class="text-base">{{ item.title }}</div>
                <div v-if="!item.published && canViewDrafts" class="text-warning">待发布稿</div>
                <UBadge
                  v-else-if="item.action === 'dit'"
                  label="DIRE"
                  variant="outline"
                  color="neutral"
                  size="sm"
                  class="text-dimmed"
                />
                <UBadge
                  v-else
                  label="PARTAGER"
                  variant="outline"
                  color="neutral"
                  size="sm"
                  class="text-dimmed"
                />
              </div>
            </template>

            <template #date="{ item }">
              <div class="flex items-center gap-2.5">
                <span class="text-dimmed/80">{{ item.date }}</span>
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

          <ModalDelete
            v-model:open="isDeleteModalOpen"
            :loading="isDeleting"
            @confirm="confirmDelete"
          >
            <div v-if="pendingDeleteItem" class="flex flex-col gap-2">
              <div class="text-sm text-primary font-semibold tracking-wider">即将消失的数据</div>
              <div class="text-sm text-muted line-clamp-2">
                {{ pendingDeleteItem.cleanContent }}
              </div>
            </div>
          </ModalDelete>
        </template>

        <div v-if="allPosts.length > 0" class="flex flex-col items-center justify-center mt-8 mb-4">
          <Transition name="fade" mode="out-in">
            <div v-if="hasMore" key="load-button">
              <UButton
                loading-auto
                variant="soft"
                color="neutral"
                class="cursor-pointer px-8"
                @click="handleLoadMore"
              >
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
import type { PostWithUser, PostsListResponse } from '~/types/posts';

const {
  allPosts,
  displayItems,
  totalItems,
  currentPage,
  isLoadingMore,
  hasMore,
  isResetting,
  canViewDrafts,
  setupRealtime,
  close,
  loadMore,
  resetPagination,
  transformPosts,
} = usePosts();

const { loggedIn } = useUserSession();
const { isRefreshing, refreshPostsAndComments } = useRefresh();
const toast = useToast();

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

watch(
  fetchResult,
  (res) => {
    if (res?.data && res.data.page === 1) {
      resetPagination(res.data.posts as PostWithUser[], res.data.totalItems, transformPosts);
    }
  },
  { immediate: true },
);

const refreshCounter = ref(0);
const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);
const pendingDeleteItem = ref<any>(null);
const animationTrigger = ref(0);

const visibleTotalItems = computed(() =>
  canViewDrafts.value ? totalItems.value : allPosts.value.filter((p) => p.published).length,
);

onMounted(() => setupRealtime());

// 💡 关键：手动刷新逻辑
const manualRefresh = async () => {
  isResetting.value = true;

  // 💡 同步重置 Timeline 的持久化进度
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
      description: `共刷新了 ${visibleTotalItems.value} 条内容`,
      icon: 'i-hugeicons:checkmark-circle-03',
      color: 'success',
    });
  }
};

const handleLoadMore = () =>
  loadMore(async () => {
    const res = await $fetch<PostsListResponse>('/api/collections/posts', {
      query: { page: currentPage.value },
    });

    return {
      items: res.data.posts as PostWithUser[],
      total: res.data.totalItems,
    };
  }, transformPosts);

const handleRequestDelete = (item: any) => {
  pendingDeleteItem.value = item;
  isDeleteModalOpen.value = true;
};

const confirmDelete = async () => {
  if (!pendingDeleteItem.value) return;
  isDeleting.value = true;
  try {
    await $fetch(`/api/collections/post/${pendingDeleteItem.value.id}`, {
      method: 'DELETE',
    });
    isDeleteModalOpen.value = false;
    toast.add({
      title: '删除成功',
      icon: 'i-hugeicons:checkmark-circle-03',
      color: 'success',
    });
  } catch (err: any) {
    toast.add({
      title: '删除失败',
      description: err.data?.message,
      icon: 'i-hugeicons:alert-02',
      color: 'error',
    });
  } finally {
    isDeleting.value = false;
    setTimeout(() => {
      pendingDeleteItem.value = null;
    }, 200);
  }
};

onUnmounted(() => {
  close();
});
</script>

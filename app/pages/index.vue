<template>
  <div class="flex flex-col items-center justify-center select-none">
    <div
      v-if="status !== 'pending' || isRefreshing || !error"
      class="flex items-center justify-center w-full gap-3"
    >
      <div class="flex items-center gap-1 text-base tracking-widest text-dimmed font-semibold">
        <ClientOnly placeholder="加载中...">
          <CommonAnimateNumber :value="visibleTotalItems" /> 条贴文和分享
        </ClientOnly>
      </div>
      <UIcon
        v-if="isRefreshing"
        name="i-hugeicons:refresh"
        class="size-4 text-muted cursor-not-allowed animate-spin"
      />
      <UIcon
        v-else-if="allPosts.length > 0"
        name="i-hugeicons:refresh"
        class="size-4 text-muted cursor-pointer hover:text-primary transition-colors"
        @click="manualRefresh"
      />
    </div>

    <UAlert
      v-if="error"
      :description="error.data?.message || '获取列表失败，请检查网络连接'"
      variant="soft"
      icon="i-hugeicons:alert-02"
      color="error"
      class="mt-4"
    />

    <div v-if="status === 'pending' && !isRefreshing" class="mt-8 space-y-4 w-full">
      <SkeletonPosts :count="3" class="opacity-60" />
    </div>

    <div
      v-else-if="!allPosts || allPosts.length === 0"
      class="flex flex-col items-center justify-center space-y-4 min-h-[calc(100vh-14rem)] pt-16"
    >
      <UEmpty
        variant="naked"
        title="暂无贴文记录"
        description="您可以点击刷新按钮尝试获取最新的贴文记录"
        :actions="[
          {
            label: '刷新',
            color: 'neutral',
            loadingAuto: true,
            onClick: manualRefresh,
          },
        ]"
      />
    </div>

    <div v-else class="mt-8 space-y-4 w-full">
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
            class="flex items-center justify-center size-8 rounded-full bg-white dark:bg-neutral-900 ring-3 ring-white dark:ring-neutral-900 shadow-sm overflow-hidden"
          >
            <UIcon :name="item.icon" class="size-6 text-primary" />
          </div>
          <CommonGravatar v-else :avatar-id="item.avatarId" :size="64" />
        </template>

        <template #title="{ item }">
          <div class="flex items-center gap-3">
            <div class="text-base">{{ item.title }}</div>
            <div v-if="!item.published && canViewDrafts" class="text-warning">待发布稿</div>
            <div v-else-if="item.action === 'dit'" class="text-dimmed/80">贴文</div>
            <div v-else class="text-dimmed/80">分享互联网</div>
          </div>
        </template>

        <template #date="{ item }">
          <div class="flex items-center gap-2.5">
            <UButton
              v-if="canViewDrafts"
              variant="link"
              color="neutral"
              icon="i-hugeicons:pencil-edit-01"
              class="size-5 mr-1.5 text-dimmed"
              :to="`/edit/${item.id}`"
            />
            <span class="text-dimmed/80">{{ item.date }}</span>
          </div>
        </template>

        <template #description="{ item, index }">
          <div
            :key="item.id"
            class="record-item-animate"
            :style="{ '--delay': `${(index % 10) * 0.08}s` }"
          >
            <ULink :to="`/${item.id}`" class="line-clamp-5 tracking-wide">
              {{ cleanMarkdown(item.description) }}
            </ULink>

            <ULink v-if="item.firstImage" :to="`/${item.id}`" class="group">
              <div
                class="my-3 rounded-xl overflow-hidden ring-1 ring-neutral-200 dark:ring-neutral-800"
              >
                <NuxtImg :src="item.firstImage" placeholder preset="preview" :custom="true">
                  <template #default="{ src, isLoaded, imgAttrs }">
                    <div class="relative overflow-hidden aspect-video">
                      <img
                        v-bind="imgAttrs"
                        :src="src"
                        :class="[
                          'w-full h-full object-cover transition-all duration-700 ease-in-out',
                          isLoaded ? 'blur-0 scale-100' : 'blur-xl scale-110',
                          'group-hover:scale-105',
                        ]"
                      />

                      <div
                        v-if="!isLoaded"
                        class="absolute inset-0 flex items-center justify-center"
                      >
                        <UIcon
                          name="i-hugeicons:refresh"
                          class="size-5 text-primary/30 animate-spin"
                        />
                      </div>
                    </div>
                  </template>
                </NuxtImg>
              </div>
            </ULink>

            <CommentsCommentUsers :post-id="item.id" :allow-comment="item.allowComment" />
          </div>
        </template>
      </CommonMotionTimeline>

      <Transition
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <SkeletonPosts v-if="isLoadingMore" :count="1" class="opacity-60" />
      </Transition>

      <div class="flex justify-center mt-8 mb-4">
        <UButton
          v-if="hasMore"
          :loading="isLoadingMore"
          variant="soft"
          color="neutral"
          class="cursor-pointer"
          @click="handleLoadMore"
        >
          加载更多
        </UButton>
        <USeparator v-else label="已经到底了" type="dashed" class="text-dimmed" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { PostRecord, PostsResponse } from '~/types/posts';

  // 获取当前用户认证状态
  const { loggedIn, user } = useUserSession();

  const { isRefreshing, isResetting, refreshPostsAndComments } = useRefresh();
  const {
    allItems: allPosts,
    currentPage,
    totalItems,
    isLoadingMore,
    hasMore,
    loadMore,
    resetPagination,
  } = usePagination<PostRecord>();

  // API 获取逻辑
  const fetchPostsApi = async (page: number) => {
    try {
      const res = await $fetch<PostsResponse>('/api/collections/posts', {
        query: { page },
      });
      return { items: res.data.posts, total: res.data.totalItems };
    } catch (err: any) {
      throw err;
    }
  };

  // SSR 初始加载
  const {
    data: fetchResult,
    status,
    error,
    refresh,
  } = await useLazyFetch<PostsResponse>('/api/collections/posts', {
    key: 'posts-list-data',
    server: true,
  });

  // 监听数据初始化
  watch(
    fetchResult,
    (res) => {
      if (res?.data.page === 1) {
        resetPagination(res.data.posts || [], res.data.totalItems || 0);
      }
    },
    { immediate: true }
  );

  // 交互逻辑
  const manualRefresh = () => refreshPostsAndComments(refresh, allPosts, currentPage);
  const handleLoadMore = () => loadMore(fetchPostsApi);

  // 检查用户是否有权限查看草稿
  const canViewDrafts = computed(() => {
    return loggedIn && user.value?.verified;
  });

  const displayItems = computed(() => {
    const items = allPosts.value.map((item) => ({
      id: item.id,
      title: item.expand?.user?.name,
      date: useRelativeTime(item.created).value,
      description: item.content,
      action: item.action,
      allowComment: item.allow_comment,
      published: item.published,
      icon: item.icon,
      avatarId: item.expand?.user?.avatar,
      firstImage: getFirstImageUrl(item.content),
    }));

    // 如果用户无权查看草稿，过滤掉未发布的文章
    if (!canViewDrafts.value) {
      return items.filter((item) => item.published);
    }

    return items;
  });

  // 修改 totalItems 的显示，根据权限调整
  const visibleTotalItems = computed(() => {
    if (!canViewDrafts.value) {
      // 只计算已发布的文章数量
      const publishedPosts = allPosts.value.filter((post) => post.published);
      return publishedPosts.length;
    }
    return totalItems.value;
  });

  onActivated(() => {
    if (allPosts.value.length === 0 && status.value !== 'pending') {
      manualRefresh();
    }
  });
</script>

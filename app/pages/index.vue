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
        class="size-4 text-muted cursor-not-allowed animate-spin" />
      <UIcon v-else-if="allPosts.length > 0" name="i-hugeicons:refresh"
        class="size-4 text-muted cursor-pointer hover:text-primary transition-colors"
        @click="manualRefresh" />
    </div>

    <UAlert v-if="error" :description="error.data?.message || '获取列表失败，请检查网络连接'" variant="soft"
      icon="i-hugeicons:alert-02" color="error" class="mt-4" />

    <div v-if="status === 'pending' && !isRefreshing" class="mt-8 space-y-4 w-full">
      <SkeletonPosts :count="3" class="opacity-60" />
    </div>

    <div v-else-if="!allPosts || allPosts.length === 0"
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

    <div v-else class="mt-8 space-y-4 w-full">
      <CommonMotionTimeline :items="displayItems" :loading-more="isLoadingMore" line-offset="15px"
        :trigger-ratio="0.55" :is-resetting="isResetting">
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
            <UBadge v-else-if="item.action === 'dit'" label="DIRE" variant="outline" size="sm" />
            <UBadge v-else label="PARTAGER" variant="outline" size="sm" />
          </div>
        </template>

        <template #date="{ item }">
          <div class="flex items-center gap-2.5">
            <UButton v-if="canViewDrafts" variant="link" color="neutral"
              icon="i-hugeicons:pencil-edit-01" tabindex="-1"
              class="size-5 mr-1.5 text-dimmed hover:text-primary" :to="`/edit/${item.id}`" />
            <ClientOnly>
              <span class="text-dimmed/80">{{ item.date }}</span>
              <template #fallback>
                <UIcon name="i-hugeicons:dashed-line-01" class="size-4.5 text-dimmed/80" />
              </template>
            </ClientOnly>
          </div>
        </template>

        <template #description="{ item, index }">
          <div :key="item.id" class="record-item-animate"
            :style="{ '--delay': `${(index % 10) * 0.08}s` }">
            <ULink :to="`/${item.id}`" class="line-clamp-4 tracking-wide leading-6 hyphens-none"
              tabindex="-1">
              {{ cleanMarkdown(item.description) }}
            </ULink>

            <ULink v-if="item.firstImage" :to="`/${item.id}`" class="group" tabindex="-1">
              <div
                class="my-3 rounded-xl overflow-hidden ring-1 ring-neutral-200 dark:ring-neutral-800">
                <NuxtImg :src="item.firstImage" placeholder preset="preview" :custom="true">
                  <template #default="{ src, isLoaded, imgAttrs }">
                    <div class="relative overflow-hidden aspect-video">
                      <img v-bind="imgAttrs" :src="src" :class="[
                        'w-full h-full object-cover transition-all duration-700 ease-in-out',
                        isLoaded ? 'blur-0 scale-100' : 'blur-xl scale-110',
                        'hover:scale-105',
                      ]" />

                      <div v-if="!isLoaded"
                        class="absolute inset-0 flex items-center justify-center">
                        <UIcon name="i-hugeicons:refresh"
                          class="size-5 text-muted/30 animate-spin" />
                      </div>
                    </div>
                  </template>
                </NuxtImg>
              </div>
            </ULink>

            <CommonLinkCard v-if="item.link_data" :data="item.link_data" />
            <CommentsCommentUsers :post-id="item.id" :allow-comment="item.allowComment" />
          </div>
        </template>
      </CommonMotionTimeline>

      <Transition enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0" enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200 ease-in" leave-from-class="opacity-100"
        leave-to-class="opacity-0">
        <SkeletonPosts v-if="isLoadingMore" :count="1" class="opacity-60" />
      </Transition>

      <div class="flex justify-center mt-8 mb-4">
        <UButton v-if="hasMore" :loading="isLoadingMore" variant="soft" color="neutral"
          class="cursor-pointer" @click="handleLoadMore">
          加载更多
        </UButton>
        <USeparator v-else label="已经到底了" type="dashed" class="text-dimmed" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  PostsResponse,
  UsersResponse,
  TypedPocketBase
} from '~/types/pocketbase-types';
import type { PostsListResponse } from '~/types/posts';

// --- 1. 类型定义：核心解决 "user 不存在" 报错 ---
// 💡 显式声明 Post 记录会通过 expand 携带 User 数据
type PostWithUser = PostsResponse<{
  user: UsersResponse
}>

// --- 2. 状态与认证 ---
const { loggedIn, user } = useUserSession();
const { isRefreshing, isResetting, refreshPostsAndComments } = useRefresh();
const { $pb } = useNuxtApp();
const pb = $pb as TypedPocketBase;

// --- 3. 分页逻辑 ---
const {
  allItems: allPosts,
  currentPage,
  totalItems,
  isLoadingMore,
  hasMore,
  loadMore,
  resetPagination,
} = usePagination<PostWithUser>(); // 💡 使用增强类型

// --- 4. 实时订阅 ---
// 💡 第一个参数是集合名，第二个是上面定义的增强类型
const { stream } = usePocketRealtime<PostWithUser>('posts');

// --- 5. 获取数据的 API 包装 ---
const fetchPostsApi = async (page: number) => {
  try {
    const res = await $fetch<PostsListResponse>('/api/collections/posts', {
      query: { page },
    });
    return {
      items: res.data.posts as PostWithUser[],
      total: res.data.totalItems
    };
  } catch (err: any) {
    throw err;
  }
};

// --- 6. SSR 初始加载 ---
const { data: fetchResult, status, error, refresh } = await useLazyFetch<PostsListResponse>('/api/collections/posts', {
  key: 'posts-list-data',
  server: true,
});

watch(fetchResult, (res) => {
  if (res?.data && res.data.page === 1) {
    resetPagination(res.data.posts as PostWithUser[], res.data.totalItems);
  }
}, { immediate: true });

// --- 7. 计算属性与权限控制 ---
const canViewDrafts = computed(() => loggedIn.value && user.value?.verified);

const displayItems = computed(() => {
  const filtered = canViewDrafts.value ? allPosts.value : allPosts.value.filter(p => p.published);

  return filtered
    .slice()
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
    .map((item) => ({
      id: item.id,
      title: item.expand?.user?.name || '未知用户', // 💡 现在这里不会报错了
      date: useRelativeTime(item.created).value,
      description: item.content,
      action: item.action,
      allowComment: item.allow_comment,
      published: item.published,
      icon: item.icon,
      avatarId: item.expand?.user?.avatar, // 💡 expand 类型已识别
      firstImage: getFirstImageUrl(item.content),
      link_data: item.link_data,
    }));
});

const visibleTotalItems = computed(() =>
  canViewDrafts.value ? totalItems.value : allPosts.value.filter(p => p.published).length
);

// --- 8. 实时流逻辑 ---
onMounted(async () => {
  await stream({
    onUpdate: async ({ action, record }) => {
      // 1. 删除逻辑：立即执行
      if (action === 'delete') {
        const idx = allPosts.value.findIndex(p => p.id === record.id);
        if (idx !== -1) {
          allPosts.value.splice(idx, 1);
          totalItems.value = Math.max(0, totalItems.value - 1);
        }
        return;
      }

      // 2. 获取完整数据
      let fullRecord: PostWithUser;
      try {
        fullRecord = await pb.collection('posts').getOne<PostWithUser>(record.id, {
          expand: 'user',
          requestKey: `sync-${record.id}`
        });
      } catch (err) { return; }

      // 3. 查找本地是否存在
      const index = allPosts.value.findIndex(p => p.id === fullRecord.id);
      const isVisible = fullRecord.published || canViewDrafts.value;

      if (action === 'create') {
        if (isVisible && index === -1) {
          allPosts.value.unshift(fullRecord);
          totalItems.value++;
        }
      } else if (action === 'update') {
        if (!isVisible && index !== -1) {
          // 变为不可见，移除
          allPosts.value.splice(index, 1);
          totalItems.value--;
        } else if (isVisible) {
          if (index !== -1) {
            // ✅ 关键修复：先提取到常量，进行非空校验
            const target = allPosts.value[index];
            if (target) {
              // 现在 TypeScript 知道 target 是 object 而不是 undefined
              Object.assign(target, fullRecord);
            }
          } else {
            // 如果原本不在列表，添加
            allPosts.value.unshift(fullRecord);
            totalItems.value++;
          }
        }
      }
    }
  });
});

const manualRefresh = () => refreshPostsAndComments(refresh, allPosts, currentPage);
const handleLoadMore = () => loadMore(fetchPostsApi);
</script>
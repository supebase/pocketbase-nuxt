import type { PostWithUser } from '~/types';

export const usePosts = () => {
  const { loggedIn, user } = useUserSession();
  const { listen, close } = usePocketRealtime();

  // 1. 全局持久化状态
  const cachedPosts = useState<PostWithUser[]>('global_posts_list', () => []);
  const cachedTotal = useState<number>('global_posts_total', () => 0);
  const isInitialLoaded = useState<boolean>('posts_initial_loaded', () => false);
  const isResetting = ref(false); // 补回动画控制变量

  // 2. 初始化底层分页
  const {
    allItems: allPosts,
    currentPage,
    totalItems,
    isLoadingMore,
    hasMore,
    isFirstLoad,
    loadMore: originalLoadMore,
    resetPagination: originalReset,
  } = usePagination<PostWithUser>(cachedPosts);

  // 3. 状态同步
  watch(totalItems, (val) => {
    cachedTotal.value = val;
  });
  if (cachedTotal.value > 0 && totalItems.value === 0) {
    totalItems.value = cachedTotal.value;
  }

  const processPost = (item: any): PostWithUser => {
    if (item._processed) return item as PostWithUser;
    return {
      ...item,
      _processed: true,
      cleanContent: item.cleanContent || (item.content ? cleanMarkdown(item.content) : ''),
      firstImage: item.firstImage || (item.content ? getFirstImageUrl(item.content) : null),
      ui: {
        date: item.created ? useRelativeTime(item.created) : '',
        userName: item.expand?.user?.name || '未知用户',
        avatarId: item.expand?.user?.avatar || undefined,
        avatarGithub: item.expand?.user?.avatar_github || undefined,
      },
      expand: item.expand || {},
    } as PostWithUser;
  };

  const transformPosts = (items: PostWithUser[]) => items.map(processPost);

  // 包装分页重置，加入动画状态控制
  const resetPagination = (items: PostWithUser[], total: number, transformFn?: any) => {
    isResetting.value = true;

    // 仅将前 20 条数据同步到全局缓存，防止 Payload 溢出
    const sliceItems = items.slice(0, 20);
    cachedPosts.value = sliceItems;

    originalReset(items, total, transformFn);
    setTimeout(() => {
      isResetting.value = false;
    }, 150);
  };

  const loadMore = (
    fetchDataFn: (page: number, signal: any) => Promise<{ items: PostWithUser[]; total: number } | undefined>,
  ) => {
    return originalLoadMore(fetchDataFn, transformPosts);
  };

  const canViewDrafts = computed(() => loggedIn.value && !!user.value?.is_admin);

  const displayItems = computed(() => {
    const items = canViewDrafts.value ? allPosts.value : allPosts.value.filter((p) => p.published);
    return items.map((item) => ({
      ...item,
      title: item.ui?.userName || '未知用户',
      date: item.ui?.date || '',
      avatarId: item.ui?.avatarId,
      avatarGithub: item.ui?.avatarGithub,
    }));
  });

  const isListening = ref(false);

  const setupRealtime = () => {
    if (import.meta.server || isListening.value) return;
    isListening.value = true;

    listen(({ collection, action, record }) => {
      if (collection !== 'posts') return;

      const recordId = record.id;
      const idx = allPosts.value.findIndex((p) => p.id === recordId);
      const processed = processPost(record as PostWithUser);
      const isVisible = processed.published || canViewDrafts.value;

      if (action === 'delete') {
        if (idx !== -1) {
          // 使用不可变方式移除
          allPosts.value = allPosts.value.filter((p) => p.id !== recordId);
          totalItems.value = Math.max(0, totalItems.value - 1);
        }
      } else if (action === 'create' && isVisible && idx === -1) {
        // 使用解构赋值创建新数组，触发最高优先级的响应式更新
        allPosts.value = [processed, ...allPosts.value];
        totalItems.value++;
      } else if (action === 'update') {
        if (idx !== -1) {
          if (!isVisible) {
            // 状态变为隐藏（撤稿），则移除
            allPosts.value = allPosts.value.filter((p) => p.id !== recordId);
            totalItems.value--;
          } else {
            // 状态更新，返回新数组实例
            allPosts.value = allPosts.value.map((p) => (p.id === recordId ? { ...p, ...processed } : p));
          }
        } else if (isVisible) {
          // 之前不在列表里的（比如从草稿变为发布），则新增
          allPosts.value = [processed, ...allPosts.value];
          totalItems.value++;
        }
      }
    });
  };

  return {
    allPosts,
    displayItems,
    totalItems,
    currentPage,
    isLoadingMore,
    hasMore,
    isFirstLoad,
    isInitialLoaded,
    isResetting,
    canViewDrafts,
    setupRealtime,
    close: () => {
      isListening.value = false;
      close();
    },
    loadMore,
    resetPagination,
    transformPosts,
  };
};

import type { PostWithUser } from '~/types/posts';

export const usePosts = () => {
  const { loggedIn, user } = useUserSession();
  const { listen, close } = usePocketRealtime();
  const { updatedMarks, clearUpdateMark } = usePostUpdateTracker();

  // 1. 全局状态持久化 (SSR 友好)
  const cachedPosts = useState<PostWithUser[]>('global_posts_list', () => []);
  const cachedTotal = useState<number>('global_posts_total', () => 0);
  const isInitialLoaded = useState<boolean>('posts_initial_loaded', () => false);

  // 2. 初始化分页工具
  const {
    allItems: allPosts,
    currentPage,
    totalItems,
    isLoadingMore,
    hasMore,
    isFirstLoad,
    loadMore: originalLoadMore,
    resetPagination,
  } = usePagination<PostWithUser>(cachedPosts);

  // 3. 状态同步：如果全局缓存有总数，初始化分页器的总数
  if (cachedTotal.value > 0 && totalItems.value === 0) {
    totalItems.value = cachedTotal.value;
  }
  watch(totalItems, (val) => {
    cachedTotal.value = val;
  });

  /**
   * 单条数据转换逻辑
   */
  const processPost = (item: any): PostWithUser => {
    if (item._processed) return item;
    return {
      ...item,
      _processed: true,
      cleanContent: item.cleanContent || cleanMarkdown(item.content || ''),
      firstImage: item.firstImage || getFirstImageUrl(item.content),
      ui: {
        date: useRelativeTime(item.created),
        userName: item.expand?.user?.name || '未知用户',
        avatarId: item.expand?.user?.avatar,
      },
    };
  };

  const transformPosts = (items: PostWithUser[]) => items.map(processPost);

  /**
   * 包装后的 loadMore
   */
  const loadMore = (fetchDataFn: (page: number) => Promise<{ items: PostWithUser[]; total: number } | undefined>) => {
    return originalLoadMore(fetchDataFn, transformPosts);
  };

  // 4. UI 计算逻辑
  const canViewDrafts = computed(() => loggedIn.value && !!user.value?.verified);
  const isResetting = ref(false);

  const displayItems = computed(() => {
    const items = canViewDrafts.value ? allPosts.value : allPosts.value.filter((p) => p.published);
    return items.map((item) => ({
      ...item,
      title: item.ui?.userName || item.expand?.user?.name || '未知用户',
      date: item.ui?.date || '',
      avatarId: item.ui?.avatarId || item.expand?.user?.avatar,
    }));
  });

  // 5. 实时数据监听
  const isListening = ref(false);
  const setupRealtime = () => {
    if (import.meta.server || isListening.value) return;
    isListening.value = true;

    listen(({ collection, action, record }) => {
      if (collection !== 'posts') return;
      const idx = allPosts.value.findIndex((p) => p.id === record.id);

      const processed = processPost(record as PostWithUser);
      const isVisible = processed.published || canViewDrafts.value;

      if (action === 'delete') {
        if (idx !== -1) {
          allPosts.value.splice(idx, 1);
          totalItems.value = Math.max(0, totalItems.value - 1);
        }
        return;
      }

      if (action === 'create' && isVisible && idx === -1) {
        allPosts.value.unshift(processed);
        totalItems.value++;
      } else if (action === 'update') {
        if (idx !== -1) {
          if (!isVisible) {
            allPosts.value.splice(idx, 1);
            totalItems.value--;
          } else {
            const oldItem = allPosts.value[idx];
            allPosts.value.splice(idx, 1, {
              ...oldItem,
              ...processed,
              expand: { ...oldItem?.expand, ...(processed.expand?.user ? processed.expand : {}) },
              _processed: false,
            } as PostWithUser);
          }
        } else if (isVisible) {
          allPosts.value.unshift(processed);
          totalItems.value++;
        }
      }
    });
  };

  const safeClose = () => {
    isListening.value = false;
    close();
  };

  onActivated(() => {
    Object.keys(updatedMarks.value).forEach(clearUpdateMark);
  });

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
    close: safeClose,
    loadMore,
    resetPagination,
    transformPosts,
  };
};

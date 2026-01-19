import type { PostWithUser } from '~/types/posts';

export const usePosts = () => {
  const { loggedIn, user } = useUserSession();
  const { listen, close } = usePocketRealtime();
  const { updatedMarks, clearUpdateMark } = usePostUpdateTracker();

  // 状态共享
  const cachedPosts = useState<PostWithUser[]>('global_posts_list', () => []);
  const cachedTotal = useState<number>('global_posts_total', () => -1);
  const isInitialLoaded = useState<boolean>('posts_initial_loaded', () => false);

  const {
    allItems: allPosts,
    currentPage,
    totalItems,
    isLoadingMore,
    hasMore,
    loadMore: originalLoadMore,
    resetPagination,
  } = usePagination<PostWithUser>(cachedPosts);

  // 同步分页工具的总数到全局状态
  if (cachedTotal.value !== -1 && totalItems.value === -1) {
    totalItems.value = cachedTotal.value;
  }
  watch(totalItems, (val) => {
    cachedTotal.value = val;
  });

  /**
   * 优化：单条数据处理逻辑
   */
  const processPost = (item: any): PostWithUser => {
    // 如果已经是处理过的，且内容没变，直接返回，避免重复计算
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

  /**
   * 工具函数：预处理 Markdown 内容
   * 用于封装给 usePagination 使用
   */
  const transformPosts = (items: PostWithUser[]) => {
    return items.map(processPost);
  };

  // 包装 loadMore，确保传入 transformPosts
  const loadMore = (fetchDataFn: (page: number) => Promise<{ items: PostWithUser[]; total: number } | undefined>) => {
    return originalLoadMore(fetchDataFn, transformPosts);
  };

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

  const isListening = ref(false);

  const setupRealtime = () => {
    if (import.meta.server || isListening.value) return;
    isListening.value = true;

    listen(({ collection, action, record }) => {
      if (collection !== 'posts') return;

      const idx = allPosts.value.findIndex((p) => p.id === record.id);

      if (action === 'delete') {
        if (idx !== -1) {
          allPosts.value.splice(idx, 1);
          totalItems.value = Math.max(0, totalItems.value - 1);
        }
        return;
      }

      // 关键优化：实时数据进入前也进行预处理
      const processed = processPost(record as PostWithUser);
      const isVisible = processed.published || canViewDrafts.value;

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
            const mergedExpand = {
              ...oldItem?.expand,
              ...(processed.expand?.user ? processed.expand : {}),
            };

            allPosts.value.splice(idx, 1, {
              ...oldItem,
              ...processed,
              expand: mergedExpand,
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

  onUnmounted(() => {
    safeClose();
  });

  onActivated(() => {
    const updatedIds = Object.keys(updatedMarks.value);
    if (updatedIds.length > 0) {
      updatedIds.forEach((id) => {
        clearUpdateMark(id);
      });
    }
  });

  return {
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
    close: safeClose,
    loadMore,
    resetPagination,
    transformPosts,
  };
};

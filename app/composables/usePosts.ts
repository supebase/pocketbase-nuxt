import type { PostWithUser } from '~/types/posts';

export const usePosts = () => {
  const { loggedIn, user } = useUserSession();
  const { listen, close } = usePocketRealtime();
  const { updatedMarks, clearUpdateMark } = usePostUpdateTracker();

  // 状态共享
  const cachedPosts = useState<PostWithUser[]>('global_posts_list', () => []);
  const cachedTotal = useState<number>('global_posts_total', () => -1);

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
  const processPost = (item: PostWithUser): PostWithUser => ({
    ...item,
    cleanContent: item.cleanContent || cleanMarkdown(item.content || ''),
    firstImage: item.firstImage || getFirstImageUrl(item.content),
  });

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

  /**
   * 优化：这里的 computed 不再执行 Markdown 解析
   * 只是简单的过滤和浅层对象映射
   */
  const displayItems = computed(() => {
    const filtered = canViewDrafts.value ? allPosts.value : allPosts.value.filter((p) => p.published);

    return filtered.map((item) => ({
      id: item.id,
      title: item.expand?.user?.name || '未知用户',
      date: useRelativeTime(item.created),
      cleanContent: item.cleanContent,
      action: item.action,
      allow_comment: item.allow_comment,
      published: item.published,
      icon: item.icon,
      avatarId: item.expand?.user?.avatar,
      firstImage: item.firstImage,
      link_data: item.link_data,
      link_image: item.link_image,
      content: item.content,
      views: item.views || 0,
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
            allPosts.value.splice(idx, 1, {
              ...oldItem,
              ...processed,
              expand: { ...(oldItem?.expand || {}), ...(record?.expand || {}) },
            });
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
    isResetting,
    canViewDrafts,
    setupRealtime,
    close: safeClose,
    loadMore,
    resetPagination,
    transformPosts,
  };
};

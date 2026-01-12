import type { PostWithUser } from '~/types/posts';

// --- 修改：全局标记防止重复订阅 ---
const isPostsSubscribed = ref(false);

export const usePosts = () => {
  const { loggedIn, user } = useUserSession();
  const { listen, close } = usePocketRealtime(['posts']);
  const { updatedMarks, clearUpdateMark } = usePostUpdateTracker();

  // --- 修改：使用 useState 确保列表在路由切换时不销毁 ---
  const cachedPosts = useState<PostWithUser[]>('global_posts_list', () => []);
  const cachedTotal = useState<number>('global_posts_total', () => -1);

  const {
    allItems: allPosts,
    currentPage,
    totalItems,
    isLoadingMore,
    hasMore,
    loadMore,
    resetPagination,
  } = usePagination<PostWithUser>(cachedPosts); // 注入全局 Ref

  // 同步分页工具的总数到全局状态
  if (cachedTotal.value !== -1 && totalItems.value === -1) {
    totalItems.value = cachedTotal.value;
  }
  watch(totalItems, (val) => {
    cachedTotal.value = val;
  });

  const isResetting = ref(false);

  /**
   * 工具函数：预处理 Markdown 内容
   * 修改：增加 firstImage 提取，减少计算属性压力
   */
  const transformPosts = (items: PostWithUser[]) => {
    return items.map((item) => ({
      ...item,
      cleanContent: cleanMarkdown(item.content || ''),
      firstImage: getFirstImageUrl(item.content), // 预处理
    }));
  };

  const canViewDrafts = computed(() => loggedIn.value && !!user.value?.verified);

  const displayItems = computed(() => {
    const filtered = canViewDrafts.value
      ? allPosts.value
      : allPosts.value.filter((p) => p.published);

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
      firstImage: item.firstImage || getFirstImageUrl(item.content),
      link_data: item.link_data,
      link_image: item.link_image,
      content: item.content,
      views: item.views || 0,
    }));
  });

  const setupRealtime = () => {
    if (import.meta.server || isPostsSubscribed.value) return;
    isPostsSubscribed.value = true;

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

      const isVisible = record.published || canViewDrafts.value;
      const processed = {
        ...record,
        cleanContent: cleanMarkdown(record.content || ''),
        firstImage: getFirstImageUrl(record.content),
      } as PostWithUser;

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
            allPosts.value[idx] = {
              ...oldItem,
              ...processed,
              expand: { ...(oldItem?.expand || {}), ...(record?.expand || {}) },
            };
          }
        } else if (isVisible) {
          allPosts.value.unshift(processed);
          totalItems.value++;
        }
      }
    });
  };

  const originalClose = close;
  const safeClose = () => {
    isPostsSubscribed.value = false;
    originalClose();
  };

  if (import.meta.client) {
    onUnmounted(() => {
      safeClose();
    });
  }

  onActivated(() => {
    const updatedIds = Object.keys(updatedMarks.value);

    if (updatedIds.length > 0) {
      updatedIds.forEach((id) => {
        // 1. 找到本地列表中对应的文章
        const idx = allPosts.value.findIndex((p) => p.id === id);

        if (idx !== -1) {
          // 这里如果是 true，说明数据更新已经由 setupRealtime 完成了
          // 或者你可以在这里执行一些 UI 上的高亮逻辑
          // console.log(`文章 ${id} 已在后台同步完成`);
        }

        // 2. --- 关键：调用你定义的清理函数 ---
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

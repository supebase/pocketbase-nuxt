import type { PostWithUser } from '~/types/posts';

export const usePosts = () => {
  const { loggedIn, user } = useUserSession();
  const { listen, close } = usePocketRealtime(['posts']);
  const { updatedMarks } = usePostUpdateTracker();

  const {
    allItems: allPosts,
    currentPage,
    totalItems,
    isLoadingMore,
    hasMore,
    loadMore,
    resetPagination,
  } = usePagination<PostWithUser>();

  const isResetting = ref(false);

  /**
   * 工具函数：预处理 Markdown 内容
   */
  const transformPosts = (items: PostWithUser[]) => {
    return items.map((item) => ({
      ...item,
      cleanContent: cleanMarkdown(item.content || ''),
    }));
  };

  /**
   * 权限检查：是否可以查看草稿
   */
  const canViewDrafts = computed(() => loggedIn.value && !!user.value?.verified);

  /**
   * 核心展示数据 (已优化)
   * 移除了冗余的 .sort()，因为服务端已通过 sort: '-created' 返回了正确顺序
   */
  const displayItems = computed(() => {
    // 1. 根据权限过滤内容
    const filtered = canViewDrafts.value
      ? allPosts.value
      : allPosts.value.filter((p) => p.published);

    // 2. 直接映射为视图对象，避免在计算属性中进行耗时的排序操作
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
      firstImage: getFirstImageUrl(item.content),
      link_data: item.link_data,
      link_image: item.link_image,
      content: item.content,
      views: item.views || 0,
    }));
  });

  /**
   * 配置实时订阅逻辑
   */
  const setupRealtime = () => {
    if (import.meta.server) return;

    listen(({ collection, action, record }) => {
      if (collection !== 'posts') return;

      const idx = allPosts.value.findIndex((p) => p.id === record.id);

      // --- 场景 1: 删除操作 ---
      if (action === 'delete') {
        if (idx !== -1) {
          allPosts.value.splice(idx, 1);
          totalItems.value = Math.max(0, totalItems.value - 1);
        }
        return;
      }

      // 计算该记录在当前用户视图下是否可见
      const isVisible = record.published || canViewDrafts.value;

      // --- 场景 2: 新增操作 ---
      if (action === 'create' && isVisible && idx === -1) {
        // 服务端返回的是最新的，所以 unshift 到头部符合时间倒序逻辑
        allPosts.value.unshift({
          ...record,
          cleanContent: cleanMarkdown(record.content || ''),
        } as PostWithUser);
        totalItems.value++;
      }

      // --- 场景 3: 更新操作 ---
      else if (action === 'update') {
        if (idx !== -1) {
          if (!isVisible) {
            // 如果更新后变为不可见（如：设为草稿），则从列表中移除
            allPosts.value.splice(idx, 1);
            totalItems.value--;
          } else {
            // 原地更新数据，保持位置不变（避免 UI 闪烁）
            const oldItem = allPosts.value[idx];
            allPosts.value[idx] = {
              ...oldItem,
              ...record,
              expand: { ...(oldItem?.expand || {}), ...(record?.expand || {}) },
              cleanContent: cleanMarkdown(record.content || ''),
            } as PostWithUser;
          }
        } else if (isVisible) {
          // 如果原本不在列表中（如：从草稿变为发布），则添加到头部
          allPosts.value.unshift({
            ...record,
            cleanContent: cleanMarkdown(record.content || ''),
          } as PostWithUser);
          totalItems.value++;
        }
      }
    });
  };

  // 客户端挂载后的清理逻辑
  if (import.meta.client) {
    onUnmounted(() => {
      close(); // 销毁连接，防止内存泄漏
    });
  }

  onActivated(() => {
    // 检查是否有标记为更新的文章
    const updatedIds = Object.keys(updatedMarks.value);
    if (updatedIds.length > 0) {
      updatedIds.forEach((id) => {
        // 这里的 refresh 逻辑可以根据你的 useFetch 配合
        // 或者直接让具体的 PostItem 监听到变化
        // console.log(`文章 ${id} 有更新，正在同步数据...`);
        // 如果你使用的是全局 list 状态，可以在这里局部更新 allPosts 中的那一条
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
    close,
    loadMore,
    resetPagination,
    transformPosts,
  };
};

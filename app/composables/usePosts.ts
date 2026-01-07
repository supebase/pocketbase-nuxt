import type { PostWithUser } from '~/types/posts';

export const usePosts = () => {
  const { loggedIn, user } = useUserSession();
  const { listen, close } = usePocketRealtime(['posts']);

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

  const transformPosts = (items: PostWithUser[]) => {
    return items.map((item) => ({
      ...item,
      cleanContent: cleanMarkdown(item.content || ''),
    }));
  };

  const canViewDrafts = computed(() => loggedIn.value && !!user.value?.verified);

  const displayItems = computed(() => {
    const filtered = canViewDrafts.value
      ? allPosts.value
      : allPosts.value.filter((p) => p.published);

    return filtered
      .slice()
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
      .map((item) => ({
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

  const setupRealtime = () => {
    if (import.meta.server) return;

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

      if (action === 'create' && isVisible && idx === -1) {
        allPosts.value.unshift({
          ...record,
          cleanContent: cleanMarkdown(record.content || ''),
        });
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
              ...record,
              expand: { ...(oldItem?.expand || {}), ...(record?.expand || {}) },
              cleanContent: cleanMarkdown(record.content || ''),
            };
          }
        } else if (isVisible) {
          allPosts.value.unshift({
            ...record,
            cleanContent: cleanMarkdown(record.content || ''),
          });
          totalItems.value++;
        }
      }
    });
  };

  if (import.meta.client) {
    onUnmounted(() => {
      close(); // 确保组件销毁时，列表页的连接也断开
    });
  }

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

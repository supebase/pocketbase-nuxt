export function useCommentStats(postId: string) {
  const isRendered = ref(false);
  const target = ref(null);
  const {
    data: statsResponse,
    status,
    refresh,
  } = useLazyFetch<any>(`/api/collections/comment/${postId}`, {
    key: `comment-stats-${postId}`,
    immediate: false,
    watch: [isRendered],
  });

  const { listen, close } = usePocketRealtime();
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const isRefreshing = ref(false); // 请求锁

  const debouncedRefresh = () => {
    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = setTimeout(async () => {
      // 如果当前正在请求中，跳过本次，等待下次触发
      // 或者利用 useFetch 的内部机制，但显式锁更可控
      if (isRefreshing.value) return;

      try {
        isRefreshing.value = true;
        await refresh();
      } finally {
        isRefreshing.value = false;
        debounceTimer = null;
      }
    }, 800); // 评论统计不需要极高实时性，800ms 更优雅
  };

  onMounted(() => {
    if (import.meta.server) return;

    listen(
      'comments',
      ({ record }) => {
        // 只有当前帖子的评论，且组件已渲染时才刷新
        if (record.post === postId && isRendered.value) {
          debouncedRefresh();
        }
      },
      // 统计组件通常不需要 expand 数据，保持 payload 最小化
      { filter: `post = "${postId}"` },
    );
  });

  onUnmounted(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    isRefreshing.value = false; // 显式重置锁状态
    close();
  });

  return {
    target,
    isRendered,
    status,
    avatarList: computed(() => {
      const data = statsResponse.value?.data;
      if (!data) return [];

      const ids = data.user_ids?.split(',').filter(Boolean) || [];
      const gravatars = data.user_avatars?.split(',') || [];
      const githubs = data.user_github_avatars?.split('|') || [];

      return ids.map((userId: string, index: number) => ({
        userId,
        avatarId: gravatars[index] || '',
        avatarGithub: githubs[index] || '',
      }));
    }),
    totalCount: computed(() => statsResponse.value?.data?.total_items || 0),
    lastUserName: computed(() => statsResponse.value?.data?.last_user_name || ''),
  };
}

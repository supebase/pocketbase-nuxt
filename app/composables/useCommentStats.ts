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
  let debounceTimer: any;

  onMounted(() => {
    if (import.meta.server) return;
    listen(({ collection, record }) => {
      if (collection === 'comments' && record.post === postId && isRendered.value) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => refresh(), 500);
      }
    });
  });

  onUnmounted(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    close();
  });

  return {
    target,
    isRendered,
    status,
    avatarList: computed(() => statsResponse.value?.data?.user_avatars?.split(',').filter(Boolean) || []),
    totalCount: computed(() => statsResponse.value?.data?.total_items || 0),
    lastUserName: computed(() => statsResponse.value?.data?.last_user_name || ''),
  };
}

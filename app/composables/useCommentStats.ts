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
    listen(
      'comments',
      ({ record }) => {
        if (record.post === postId && isRendered.value) {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => refresh(), 500);
        }
      },
      { expand: 'user' },
    );
  });

  onUnmounted(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
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

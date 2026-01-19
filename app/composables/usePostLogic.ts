import type { SinglePostResponse } from '~/types/posts';

export const usePostLogic = (id: string | string[]) => {
  const { updatedMarks, clearUpdateMark } = usePostUpdateTracker();
  const { user: currentUser } = useUserSession();
  const { listen, close } = usePocketRealtime();

  const idRef = computed(() => (isRef(id) ? id.value : Array.isArray(id) ? id[0] : id));

  const { data, status, refresh, error } = useFetch<SinglePostResponse>(() => `/api/collections/post/${idRef.value}`, {
    key: `post-detail-${idRef.value}`,
    server: true,
    lazy: true,
    immediate: true,
    query: { userId: computed(() => currentUser.value?.id) },
  });

  const ast = computed(() => data.value?.data?.mdcAst || null);
  const toc = computed(() => ast.value?.toc || null);

  const setupRealtime = () => {
    if (import.meta.server) return;
    listen(async ({ collection, action, record }) => {
      const targetId = idRef.value;
      if (collection !== 'posts' || record.id !== targetId) return;

      if (action === 'update') {
        if (data.value?.data) {
          data.value.data.views = record.views;
          if (record.content !== data.value.data.content) {
            await refresh();
          }
        }
      } else if (action === 'delete') {
        await navigateTo('/');
      }
    });
  };

  if (import.meta.client) {
    onMounted(() => setupRealtime());
    onUnmounted(() => close());
  }

  return {
    postWithRelativeTime: computed(() => {
      const postData = data.value?.data;
      if (!postData) return null;
      return { ...postData, relativeTime: useRelativeTime(postData.created) };
    }),
    status,
    error,
    refresh,
    ast,
    toc,
    updatedMarks,
    clearUpdateMark,
  };
};

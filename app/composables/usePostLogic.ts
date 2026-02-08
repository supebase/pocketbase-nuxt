import type { SinglePostResponse } from '~/types';

export const usePostLogic = (id: string | string[]) => {
  const { updatedMarks, clearUpdateMark } = usePostUpdateTracker();
  const { user: currentUser } = useUserSession();
  const { listen, close } = usePocketRealtime();
  const toast = useToast();

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

  let refreshDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  const setupRealtime = () => {
    if (import.meta.server) return;

    listen(async ({ collection, action, record }) => {
      const targetId = idRef.value;
      if (collection !== 'posts' || record.id !== targetId) return;

      if (action === 'update') {
        if (data.value?.data) {
          data.value = {
            ...data.value,
            data: {
              ...data.value.data,
              views: record.views,
              poll: !!record.poll,
              reactions: !!record.reactions,
              allow_comment: !!record.allow_comment,
            },
          };
          // 重量级数据：防抖刷新（Content 涉及 AST 重新解析）
          if (record.content !== data.value.data.content) {
            if (refreshDebounceTimer) clearTimeout(refreshDebounceTimer);

            refreshDebounceTimer = setTimeout(() => {
              if (idRef.value === record.id) {
                refresh();
              }
            }, 1000); // 1秒延迟
          }
        }
      } else if (action === 'delete') {
        await navigateTo('/', { replace: true });

        if (import.meta.client) {
          toast.add({
            title: '很遗憾，你访问的内容已被删除。',
            color: 'error',
          });
        }
      }
    });
  };

  if (import.meta.client) {
    onMounted(() => setupRealtime());
    onUnmounted(() => {
      if (refreshDebounceTimer) clearTimeout(refreshDebounceTimer);
      close();
    });
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

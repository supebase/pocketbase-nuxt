import type { SinglePostResponse } from '~/types/posts';

export const usePostLogic = (id: string | string[]) => {
  const { updatedMarks, clearUpdateMark } = usePostUpdateTracker();
  const { user: currentUser } = useUserSession();
  const { listen, close } = usePocketRealtime(['posts']);

  // 数据抓取：开启 server 端抓取以支持 SSR 和 SEO
  const { data, status, refresh, error } = useFetch<SinglePostResponse>(
    () => `/api/collections/post/${unref(id)}`,
    {
      key: `post-detail-${unref(id)}`,
      server: true,
      query: { userId: computed(() => currentUser.value?.id) },
    },
  );

  // 直接关联服务端返回的 AST
  const ast = computed(() => data.value?.data?.mdcAst || null);
  const toc = computed(() => ast.value?.toc || null);

  // 状态判定：只有在 success 且 ast 存在时才算 ready
  const mdcReady = computed(() => {
    return status.value === 'success' && !!ast.value;
  });

  // 实时监听逻辑 (仅在客户端)
  if (import.meta.client) {
    onMounted(() => {
      listen(({ collection, action, record }) => {
        if (collection === 'posts' && record.id === unref(id) && action === 'update') {
          if (data.value?.data) {
            data.value.data.views = record.views;
            // 注意：如果内容(content)发生变化，实时同步推荐直接触发 refresh()
            // 这样能确保重新走一遍服务端的最新解析逻辑
            if (record.content !== data.value.data.content) {
              refresh();
            }
          }
        }
      });
    });
    onUnmounted(close);
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
    mdcReady,
    ast,
    toc,
    updatedMarks,
    clearUpdateMark,
  };
};

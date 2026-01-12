import type { SinglePostResponse } from '~/types/posts';

export const usePostLogic = (id: string | string[]) => {
  const { updatedMarks, clearUpdateMark } = usePostUpdateTracker();
  const { user: currentUser } = useUserSession();
  const { listen, close } = usePocketRealtime();

  // 数据抓取：开启 server 端抓取以支持 SSR 和 SEO
  const { data, status, refresh, error } = useFetch<SinglePostResponse>(() => `/api/collections/post/${unref(id)}`, {
    key: `post-detail-${unref(id)}`,
    server: true,
    query: { userId: computed(() => currentUser.value?.id) },
  });

  // 直接关联服务端返回的 AST
  const ast = computed(() => data.value?.data?.mdcAst || null);
  const toc = computed(() => ast.value?.toc || null);

  // 状态判定：只有在 success 且 ast 存在时才算 ready
  const mdcReady = computed(() => {
    return status.value === 'success' && !!ast.value;
  });

  // 实时监听逻辑 (仅在客户端)
  const setupRealtime = () => {
    if (import.meta.server) return;

    listen(async ({ collection, action, record }) => {
      // 只有当集合匹配且 ID 对应时才处理
      const targetId = unref(id);
      if (collection !== 'posts' || record.id !== targetId) return;

      if (action === 'update') {
        if (data.value?.data) {
          // 浏览量等轻量字段：手动热更新 UI，无需刷新页面
          data.value.data.views = record.views;

          // 内容变化：由于涉及服务端 AST 解析，必须调用 refresh
          // 这样能确保重新获取服务端生成的最新 mdcAst
          if (record.content !== data.value.data.content) {
            console.log('[SSE] 内容变化，刷新 AST...');
            refresh();
          }
        }
      } else if (action === 'delete') {
        // 如果文章被删除了，可以重定向或修改状态
        // data.value = null;
        await navigateTo('/');
      }
    });
  };

  if (import.meta.client) {
    onMounted(() => {
      setupRealtime();
    });

    // usePocketRealtime 的 close 会精准移除当前 callback
    onUnmounted(() => {
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
    mdcReady,
    ast,
    toc,
    updatedMarks,
    clearUpdateMark,
  };
};

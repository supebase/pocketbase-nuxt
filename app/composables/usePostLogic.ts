import type { SinglePostResponse, PostRecord } from '~/types';

export const usePostLogic = (id: string | string[]) => {
  const { updatedMarks, clearUpdateMark } = usePostUpdateTracker();
  const { user: currentUser } = useUserSession();
  const { listen, close: pbClose } = usePocketRealtime();
  const toast = useToast();

  // 1. 统一 ID 引用，支持响应式变更
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

  // 2. 状态控制：刷新锁与防抖计时器
  const isRefreshing = ref(false);
  let refreshDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  const setupRealtime = () => {
    if (import.meta.server || !idRef.value) return;

    // 确保清理旧订阅（针对 SPA 路由切换场景）
    pbClose('posts');

    listen(
      'posts',
      async ({ action, record }) => {
        // 确保只处理当前文章
        if (record.id !== idRef.value) return;

        if (action === 'update') {
          const currentData = data.value?.data;
          if (!currentData) return;

          /**
           * 策略：轻重分离更新
           * 轻量级字段（views, poll 等）直接内存 patch，保持响应式，且不破坏 mdcAst。
           * 重量级字段（content）由于涉及服务端解析 AST，必须触发 refresh。
           */

          // A. 同步轻量级字段（这些字段在 record 和 currentData 中结构一致）
          currentData.views = record.views;
          currentData.poll = !!record.poll;
          currentData.reactions = !!record.reactions;
          currentData.allow_comment = !!record.allow_comment;

          // B. 处理正文内容的重量级刷新
          // 只有当正文确实发生变化时，才触发全量刷新
          if (record.content && record.content !== currentData.content) {
            if (refreshDebounceTimer) clearTimeout(refreshDebounceTimer);

            // 如果已经在请求中，则不开启新的计时器
            if (isRefreshing.value) return;

            refreshDebounceTimer = setTimeout(async () => {
              // 二次确认 ID 没变
              if (idRef.value !== record.id) return;

              try {
                isRefreshing.value = true;
                await refresh(); // Nuxt useFetch 的 refresh 会重新拉取全量数据（包含新 AST）
              } finally {
                isRefreshing.value = false;
                refreshDebounceTimer = null;
              }
            }, 1000); // 1秒防抖，避免编辑频繁保存时的请求风暴
          }
        } else if (action === 'delete') {
          // 文章被删除，强制回退并提示
          await navigateTo('/', { replace: true });

          if (import.meta.client) {
            toast.add({
              title: '提示',
              description: '很遗憾，你访问的内容已被删除。',
              color: 'error',
              icon: 'i-hugeicons:delete-02',
            });
          }
        }
      },
      { expand: 'user' },
    );
  };

  if (import.meta.client) {
    // 挂载初始化
    onMounted(() => setupRealtime());

    // 监听 ID 变化（如从文章 A 页面直接跳转到文章 B 页面）
    watch(idRef, (newId, oldId) => {
      if (newId !== oldId) {
        if (refreshDebounceTimer) clearTimeout(refreshDebounceTimer);
        setupRealtime();
      }
    });

    onUnmounted(() => {
      if (refreshDebounceTimer) clearTimeout(refreshDebounceTimer);
      pbClose('posts');
    });
  }

  return {
    postWithRelativeTime: computed(() => {
      const postData = data.value?.data;
      if (!postData) return null;
      return {
        ...postData,
        relativeTime: useRelativeTime(postData.created),
      };
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

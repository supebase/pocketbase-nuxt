import { parseMarkdown } from '@nuxtjs/mdc/runtime';
import type { SinglePostResponse } from '~/types/posts';

export const usePostLogic = (id: string | string[]) => {
  const { updatedMarks, clearUpdateMark } = usePostUpdateTracker();
  const { user: currentUser } = useUserSession();

  // 1. 获取 realtime 工具
  const { listen, close } = usePocketRealtime(['posts']);

  // 2. 实时监听逻辑
  if (import.meta.client) {
    onMounted(() => {
      listen(({ collection, action, record }) => {
        // 确保只监听当前文章的更新
        if (collection === 'posts' && record.id === id && action === 'update') {
          if (data.value?.data) {
            data.value.data.views = record.views;
          }
        }
      });
    });

    onUnmounted(() => {
      close();
    });
  }

  // 3. 数据抓取 (关闭 server 端抓取，完全由客户端负责)
  const { data, status, refresh, error } = useLazyFetch<SinglePostResponse>(
    () => `/api/collections/post/${id}`,
    {
      key: `post-detail-${id}`,
      server: false, // 不需要 SEO 时，设为 false 性能更好
      query: { userId: computed(() => currentUser.value?.id) },
    },
  );

  const mdcReady = ref(false);
  const ast = ref<any>(null);
  const toc = ref<any>(null);
  const isUpdateRefresh = ref(false);

  const postWithRelativeTime = computed(() => {
    const postData = data.value?.data;
    if (!postData) return null;
    return {
      ...postData,
      relativeTime: useRelativeTime(postData.created),
    };
  });

  const parseContent = async (content: string) => {
    if (!content) {
      mdcReady.value = true;
      return;
    }
    if (!isUpdateRefresh.value) mdcReady.value = false;

    try {
      const result = await parseMarkdown(content, { toc: { depth: 4, searchDepth: 4 } });
      ast.value = result;
      toc.value = result.toc;
      await nextTick();
    } catch (e) {
      console.error('MDC 渲染错误:', e);
    } finally {
      mdcReady.value = true;
      isUpdateRefresh.value = false;
    }
  };

  return {
    postWithRelativeTime,
    status,
    error,
    refresh,
    mdcReady,
    ast,
    toc,
    isUpdateRefresh,
    parseContent,
    updatedMarks,
    clearUpdateMark,
  };
};

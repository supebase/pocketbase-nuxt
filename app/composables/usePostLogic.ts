import { parseMarkdown } from '@nuxtjs/mdc/runtime';
import type { SinglePostResponse } from '~/types/posts';

export const usePostLogic = (id: string | string[]) => {
  const { updatedMarks, clearUpdateMark } = usePostUpdateTracker();
  const { user: currentUser } = useUserSession();
  const { listen, close } = usePocketRealtime(['posts']);

  // 1. 数据抓取：开启 server 端抓取以支持 SSR 和 SEO
  const { data, status, refresh, error } = useFetch<SinglePostResponse>(
    () => `/api/collections/post/${id}`,
    {
      key: `post-detail-${id}`,
      server: true, // 开启 SSR
      query: { userId: computed(() => currentUser.value?.id) },
    },
  );

  const mdcReady = ref(false);
  const ast = ref<any>(null);
  const toc = ref<any>(null);
  const isUpdateRefresh = ref(false);

  // 2. 核心解析函数 (适配 SSR)
  const parseContent = async (content: string) => {
    if (!content) {
      mdcReady.value = true;
      return;
    }

    try {
      if (ast.value && ast.value.body.value === content) {
        mdcReady.value = true;
        return;
      }

      const result = await parseMarkdown(content, {
        toc: { depth: 4, searchDepth: 4 },
      });
      // 存储结果
      ast.value = result;
      toc.value = result.toc;
    } catch (e) {
      console.error('MDC 渲染错误:', e);
    } finally {
      mdcReady.value = true;
      isUpdateRefresh.value = false;
    }
  };

  // 3. 实时监听逻辑 (仅在客户端)
  if (import.meta.client) {
    onMounted(() => {
      listen(({ collection, action, record }) => {
        if (collection === 'posts' && record.id === id && action === 'update') {
          if (data.value?.data) {
            data.value.data.views = record.views;
            // 如果内容变了，也可以选择在这里调用 parseContent(record.content)
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
    isUpdateRefresh,
    parseContent,
    updatedMarks,
    clearUpdateMark,
  };
};

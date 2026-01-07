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

    // 💡 [新增逻辑] 判断是否需要显示遮罩
    // 如果是由于 ID 切换导致的解析，且此时 mdcReady 还是 true，说明需要重置
    if (!isUpdateRefresh.value && ast.value?.body?.value !== content) {
      mdcReady.value = false;
    }

    try {
      // 性能优化：内容完全一致则跳过解析
      if (ast.value && ast.value.body?.value === content) {
        mdcReady.value = true;
        return;
      }

      const result = await parseMarkdown(content, {
        toc: { depth: 4, searchDepth: 4 },
      });
      ast.value = result;
      toc.value = result.toc;
    } catch (e) {
      console.error('MDC 渲染错误:', e);
    } finally {
      // 💡 [确保状态] 解析完成或失败，都要解锁并关闭“同步”标记
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

import type { PaginationResult, TransformFn } from '~/types';

export function usePagination<T extends { id: string | number }>(initialItems?: Ref<T[]>) {
  const allItems = initialItems || (ref<T[]>([]) as Ref<T[]>);
  const currentPage = ref(1);
  const totalItems = ref(0);
  const isLoadingMore = ref(false);
  const isFirstLoad = ref(true);

  // 用于管理请求的取消
  let abortController: AbortController | null = null;

  const hasMore = computed(() => {
    if (isFirstLoad.value) return true;
    return allItems.value.length < totalItems.value;
  });

  const mergeItems = (existing: T[], incoming: T[], transformFn?: TransformFn<T>): T[] => {
    const processedIncoming = transformFn ? transformFn(incoming) : incoming;
    const map = new Map<T['id'], T>(existing.map((item) => [item.id, item]));
    processedIncoming.forEach((item) => map.set(item.id, item));

    return Array.from(map.values()).sort((a: any, b: any) => {
      const dateA = new Date(a.created || 0).getTime();
      const dateB = new Date(b.created || 0).getTime();
      return dateB - dateA;
    });
  };

  /**
   * 加载更多数据
   * 修改：fetchDataFn 现在接收第二个参数 signal
   */
  const loadMore = async (
    fetchDataFn: (page: number, signal?: AbortSignal) => Promise<PaginationResult<T> | undefined>,
    transformFn?: TransformFn<T>,
  ) => {
    if (isLoadingMore.value || !hasMore.value) return;

    // 竞态处理：如果上一次请求还没回来，直接取消它
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    isLoadingMore.value = true;
    try {
      const nextPage = currentPage.value + 1;
      // 将当前请求的信号传递下去
      const result = await fetchDataFn(nextPage, abortController.signal);

      if (result?.items) {
        totalItems.value = result.total;
        allItems.value = mergeItems(allItems.value as T[], result.items, transformFn);
        currentPage.value = nextPage;
        isFirstLoad.value = false;
      }
    } catch (err: any) {
      // 忽略由手动取消引起的错误
      if (err.name === 'AbortError' || err.message === 'canceled') {
        return;
      }
      throw err;
    } finally {
      // 只有当前请求依然是最新请求时才重置加载状态
      if (!abortController?.signal.aborted) {
        isLoadingMore.value = false;
      }
    }
  };

  const resetPagination = (items: T[], total: number, transformFn?: TransformFn<T>) => {
    // 重置时也应取消进行中的请求
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    allItems.value = transformFn ? transformFn(items) : items;
    totalItems.value = total;
    currentPage.value = 1;
    isFirstLoad.value = false;
    isLoadingMore.value = false;
  };

  return {
    allItems,
    currentPage,
    totalItems,
    isLoadingMore,
    hasMore,
    isFirstLoad,
    loadMore,
    resetPagination,
  };
}

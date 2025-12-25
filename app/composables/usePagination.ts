/**
 * 通用的分页管理
 */
export function usePagination<T>() {
  const allItems = ref<T[]>([]) as Ref<T[]>;
  const currentPage = ref(1);
  const totalItems = ref(0);
  const isLoadingMore = ref(false);

  const hasMore = computed(() => allItems.value.length < totalItems.value);

  /**
   * 加载更多
   */
  const loadMore = async (
    fetchDataFn: (page: number) => Promise<{ items: T[]; total: number } | undefined>,
    // 💡 增加一个可选的预处理回调
    transformFn?: (items: T[]) => T[]
  ) => {
    if (isLoadingMore.value || !hasMore.value) return;

    try {
      isLoadingMore.value = true;
      const nextPage = currentPage.value + 1;
      const result = await fetchDataFn(nextPage);

      if (result && result.items.length > 0) {
        // 💡 如果有转换函数，先转换再合并
        const newItems = transformFn ? transformFn(result.items) : result.items;

        allItems.value = [...allItems.value, ...newItems];
        totalItems.value = result.total;
        currentPage.value = nextPage;
      }
    } catch (err) {
      console.error('Pagination error:', err);
    } finally {
      // 这里的 setTimeout 建议缩短或移除，除非是为了视觉缓冲
      setTimeout(() => {
        isLoadingMore.value = false;
      }, 100);
    }
  };

  const resetPagination = (items: T[], total: number, transformFn?: (items: T[]) => T[]) => {
    // 💡 初始重置时也应用转换
    allItems.value = transformFn ? transformFn(items) : items;
    totalItems.value = total;
    currentPage.value = 1;
  };

  return {
    allItems,
    currentPage,
    totalItems,
    isLoadingMore,
    hasMore,
    loadMore,
    resetPagination,
  };
}
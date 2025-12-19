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
   * @param fetchDataFn 请求函数，内部会自动传入 nextPage
   */
  const loadMore = async (
    fetchDataFn: (page: number) => Promise<{ items: T[]; total: number } | undefined>
  ) => {
    if (isLoadingMore.value || !hasMore.value) return;

    try {
      isLoadingMore.value = true;
      const nextPage = currentPage.value + 1;
      const result = await fetchDataFn(nextPage);

      if (result && result.items.length > 0) {
        allItems.value = [...allItems.value, ...result.items];
        totalItems.value = result.total;
        currentPage.value = nextPage;
        await nextTick();
      }
    } catch (err) {
      console.error("Pagination error:", err);
    } finally {
      setTimeout(() => {
        isLoadingMore.value = false;
      }, 100);
    }
  };

  const resetPagination = (items: T[], total: number) => {
    allItems.value = items;
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

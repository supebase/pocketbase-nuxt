export function usePagination<T extends { id: string | number }>() {
  const allItems = ref<T[]>([]) as Ref<T[]>;
  const currentPage = ref(1);
  const totalItems = ref(0);
  const isLoadingMore = ref(false);

  const hasMore = computed(() => allItems.value.length < totalItems.value);

  const mergeItems = (existing: T[], incoming: T[], transformFn?: (items: T[]) => T[]) => {
    const transformed = transformFn ? transformFn(incoming) : incoming;
    // 使用 Map 去重：优先保留最新的数据（Incoming 通常是 API 返回的新分页）
    const itemMap = new Map(existing.map((item) => [item.id, item]));
    transformed.forEach((item) => itemMap.set(item.id, item));
    return Array.from(itemMap.values());
  };

  const loadMore = async (
    fetchDataFn: (page: number) => Promise<{ items: T[]; total: number } | undefined>,
    transformFn?: (items: T[]) => T[]
  ) => {
    if (isLoadingMore.value || !hasMore.value) return;

    try {
      isLoadingMore.value = true;
      const nextPage = currentPage.value + 1;
      const result = await fetchDataFn(nextPage);

      if (result) {
        totalItems.value = result.total;
        if (result.items.length > 0) {
          allItems.value = mergeItems(allItems.value, result.items, transformFn);
          currentPage.value = nextPage;
        }
      }
    } catch (err) {
      console.error('[Pagination] Load more error:', err);
    } finally {
      isLoadingMore.value = false;
    }
  };

  const resetPagination = (items: T[], total: number, transformFn?: (items: T[]) => T[]) => {
    allItems.value = transformFn ? transformFn(items) : items;
    totalItems.value = total;
    currentPage.value = 1;
  };

  return { allItems, currentPage, totalItems, isLoadingMore, hasMore, loadMore, resetPagination };
}

export function usePagination<T extends { id: string | number }>(initialItems?: Ref<T[]>) {
  // --- 修改：优先使用外部传入的 Ref，实现状态共享 ---
  const allItems = initialItems || (ref<T[]>([]) as Ref<T[]>);
  const currentPage = ref(1);
  const totalItems = ref(-1);
  const isLoadingMore = ref(false);

  const hasMore = computed(() => {
    if (totalItems.value === -1) return true;
    if (totalItems.value === 0) return false;
    return allItems.value.length < totalItems.value;
  });

  const mergeItems = (existing: T[], incoming: T[], transformFn?: (items: T[]) => T[]) => {
    const transformed = transformFn ? transformFn(incoming) : incoming;
    const itemMap = new Map(existing.map((item) => [item.id, item]));
    transformed.forEach((item) => itemMap.set(item.id, item));
    return Array.from(itemMap.values());
  };

  const loadMore = async (
    fetchDataFn: (page: number) => Promise<{ items: T[]; total: number } | undefined>,
    transformFn?: (items: T[]) => T[],
  ) => {
    if (isLoadingMore.value || !hasMore.value) return;
    try {
      isLoadingMore.value = true;
      const nextPage = currentPage.value + 1;
      const result = await fetchDataFn(nextPage);

      if (result && result.items && result.items.length > 0) {
        totalItems.value = result.total;
        allItems.value = mergeItems(allItems.value, result.items, transformFn);
        currentPage.value = nextPage;
      } else {
        totalItems.value = allItems.value.length;
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
    isLoadingMore.value = false;
  };

  return { allItems, currentPage, totalItems, isLoadingMore, hasMore, loadMore, resetPagination };
}

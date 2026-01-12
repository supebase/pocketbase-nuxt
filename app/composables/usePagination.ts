export function usePagination<T extends { id: string | number }>(initialItems?: Ref<T[]>) {
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
    // 关键点：合并前先通过 transformFn 预处理新数据
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

      if (result && result.items) {
        totalItems.value = result.total;
        // 这里的 transformFn 会将 Markdown 转换后的结果存入 allItems
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

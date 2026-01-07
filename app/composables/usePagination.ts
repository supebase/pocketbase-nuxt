export function usePagination<T extends { id: string | number }>() {
  const allItems = ref<T[]>([]) as Ref<T[]>;
  const currentPage = ref(1);
  const totalItems = ref(-1); // 初始化为 -1，表示尚未从 API 获取过总数
  const isLoadingMore = ref(false);

  // 逻辑优化：确保 totalItems 和已加载数量同步
  const hasMore = computed(() => {
    // 如果从未加载过数据 (-1)，默认允许尝试加载
    if (totalItems.value === -1) return true;
    // 如果 API 明确返回 0，则无更多数据
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

      // 修复逻辑：不仅要判断 result，还要判断 items 是否为空
      if (result && result.items && result.items.length > 0) {
        totalItems.value = result.total;
        allItems.value = mergeItems(allItems.value, result.items, transformFn);
        currentPage.value = nextPage;
      } else {
        // 如果没有新数据，强制将 totalItems 设为当前长度，切断 hasMore
        totalItems.value = allItems.value.length;
      }
    } catch (err) {
      console.error('[Pagination] Load more error:', err);
      // 发生错误时，不递增页码，允许用户稍后重试
    } finally {
      isLoadingMore.value = false;
    }
  };

  const resetPagination = (items: T[], total: number, transformFn?: (items: T[]) => T[]) => {
    allItems.value = transformFn ? transformFn(items) : items;
    totalItems.value = total;
    currentPage.value = 1; // 确保重置回到第一页
    isLoadingMore.value = false; // 强制重置加载状态，防止上一次分类的加载未完成导致死锁
  };

  return { allItems, currentPage, totalItems, isLoadingMore, hasMore, loadMore, resetPagination };
}

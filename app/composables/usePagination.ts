export interface PaginationResult<T> {
  items: T[];
  total: number;
}

export type TransformFn<T> = (items: T[]) => T[];

export function usePagination<T extends { id: string | number }>(initialItems?: Ref<T[]>) {
  // 1. 初始化状态：使用更清晰的命名和类型推断
  const allItems = initialItems || (ref<T[]>([]) as Ref<T[]>);
  const currentPage = ref(1);
  const totalItems = ref(0);
  const isLoadingMore = ref(false);
  const isFirstLoad = ref(true); // 增加一个状态位，区分“初始空”和“加载完后的空”

  // 2. 逻辑分明：计算是否还有更多数据
  const hasMore = computed(() => {
    if (isFirstLoad.value) return true; // 还没加载过时，默认认为有数据
    return allItems.value.length < totalItems.value;
  });

  /**
   * 优雅的去重合并逻辑
   * 使用 reduce 代替 forEach 配合 Map，更具函数式风格
   */
  const mergeItems = (existing: T[], incoming: T[], transformFn?: TransformFn<T>): T[] => {
    const processedIncoming = transformFn ? transformFn(incoming) : incoming;

    // 使用 Map 去重（防止分页拉取到已通过 SSE 插入的数据）
    const map = new Map<T['id'], T>(existing.map((item) => [item.id, item]));
    processedIncoming.forEach((item) => map.set(item.id, item));

    // 重新排序
    // 实时系统中，顶部插入会打乱 Offset 分页。合并后强制排序可以纠正 UI。
    return Array.from(map.values()).sort((a: any, b: any) => {
      const dateA = new Date(a.created || 0).getTime();
      const dateB = new Date(b.created || 0).getTime();
      return dateB - dateA; // 降序：最新的在前
    });
  };

  /**
   * 加载更多数据
   */
  const loadMore = async (
    fetchDataFn: (page: number) => Promise<PaginationResult<T> | undefined>,
    transformFn?: TransformFn<T>,
  ) => {
    // 守卫语句：防止重复加载或无效加载
    if (isLoadingMore.value || !hasMore.value) return;

    isLoadingMore.value = true;
    try {
      const nextPage = currentPage.value + 1;
      const result = await fetchDataFn(nextPage);

      if (result?.items) {
        totalItems.value = result.total;
        allItems.value = mergeItems(allItems.value as T[], result.items, transformFn);
        currentPage.value = nextPage;
        isFirstLoad.value = false;
      }
    } catch (err) {
      // 专业的错误处理：不仅 console，还应该抛出或标记错误状态
      console.error('[Pagination] Failed to fetch more items:', err);
      throw err; // 抛出错误让调用者决定是否显示 Toast
    } finally {
      isLoadingMore.value = false;
    }
  };

  /**
   * 重置分页
   */
  const resetPagination = (items: T[], total: number, transformFn?: TransformFn<T>) => {
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

import { useDebounceFn } from '@vueuse/core';
import { MIN_SEARCH_LENGTH } from '~/constants';
import type { PostRecord, PostsListResponse } from '~/types/posts';

export const useSearchLogic = () => {
  const searchQuery = ref('');
  const isLoading = ref(false);
  const isComposing = ref(false);

  // 复用现有的分页逻辑
  const { allItems, totalItems, resetPagination, hasMore, isLoadingMore, loadMore } =
    usePagination<PostRecord>();

  // 核心搜索执行 (处理初始搜索和竞态)
  const performSearch = async (query: string) => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < MIN_SEARCH_LENGTH) {
      resetPagination([], 0);
      return;
    }

    isLoading.value = true;
    try {
      const response = await $fetch<PostsListResponse>('/api/collections/posts', {
        query: { q: trimmedQuery, page: 1 },
      });

      // 竞态检查：确保返回的结果对应当前的输入
      if (searchQuery.value === query) {
        resetPagination(response.data.posts || [], response.data.totalItems);
      }
    } catch (err) {
      resetPagination([], 0);
    } finally {
      isLoading.value = false;
    }
  };

  // 分页抓取函数 (传给 loadMore)
  const fetchMoreData = async (page: number) => {
    const response = await $fetch<PostsListResponse>('/api/collections/posts', {
      query: { q: searchQuery.value.trim(), page },
    });

    return {
      items: response.data.posts || [],
      total: response.data.totalItems,
    };
  };

  // 防抖处理
  const debouncedSearch = useDebounceFn((val: string) => {
    performSearch(val);
  }, 400);

  // 监听输入变化
  watch(searchQuery, (newVal) => {
    if (isComposing.value) return;

    if (!newVal.trim() || newVal.trim().length < MIN_SEARCH_LENGTH) {
      resetPagination([], 0);
      isLoading.value = false;
      return;
    }

    isLoading.value = true;
    debouncedSearch(newVal);
  });

  return {
    searchQuery,
    isLoading,
    isComposing,
    allItems,
    totalItems,
    hasMore,
    isLoadingMore,
    resetPagination,
    loadMore,
    performSearch,
    fetchMoreData,
  };
};

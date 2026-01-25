import { useDebounceFn } from '@vueuse/core';
import { MIN_SEARCH_LENGTH } from '~/constants';
import type { PostRecord, PostsListResponse } from '~/types';

export const useSearchLogic = () => {
  const searchQuery = ref('');
  const isLoading = ref(false);
  const isComposing = ref(false);

  const { allItems, totalItems, resetPagination, hasMore, isLoadingMore, isFirstLoad, loadMore } =
    usePagination<PostRecord>();

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

      if (searchQuery.value === query) {
        resetPagination(response.data.posts || [], response.data.totalItems);
      }
    } catch (err) {
      resetPagination([], 0);
    } finally {
      isLoading.value = false;
    }
  };

  const fetchMoreData = async (page: number) => {
    const response = await $fetch<PostsListResponse>('/api/collections/posts', {
      query: { q: searchQuery.value.trim(), page },
    });
    return { items: response.data.posts || [], total: response.data.totalItems };
  };

  const debouncedSearch = useDebounceFn((val: string) => performSearch(val), 600);

  watch(searchQuery, (newVal) => {
    const trimmed = newVal.trim();
    if (isComposing.value) {
      isLoading.value = trimmed.length >= MIN_SEARCH_LENGTH;
      return;
    }
    if (trimmed.length < MIN_SEARCH_LENGTH) {
      isLoading.value = false;
      resetPagination([], 0);
      return;
    }
    isLoading.value = true;
    debouncedSearch(trimmed);
  });

  return {
    searchQuery,
    isLoading,
    isComposing,
    allItems,
    totalItems,
    hasMore,
    isLoadingMore,
    isFirstLoad,
    resetPagination,
    loadMore,
    performSearch,
    fetchMoreData,
  };
};

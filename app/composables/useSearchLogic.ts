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
  }, 600);

  // 监听输入变化
  watch(searchQuery, (newVal) => {
    const trimmed = newVal.trim();

    // 1. 如果正在合成中，我们不应该设置 isLoading = true
    // 而是让 UI 根据当前文字长度自然展示“请输入更多”或“搜索中”
    if (isComposing.value) {
      // 只有当拼音长度已经足够触发搜索时，才为了视觉平滑开启加载状态
      // 如果长度不够，我们保持 isLoading 为 false，这样 #empty 就会走长度判断逻辑
      isLoading.value = trimmed.length >= MIN_SEARCH_LENGTH;
      return;
    }

    // 2. 长度不足判断
    if (trimmed.length < MIN_SEARCH_LENGTH) {
      isLoading.value = false;
      resetPagination([], 0);
      return;
    }

    // 3. 正常触发防抖搜索
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
    resetPagination,
    loadMore,
    performSearch,
    fetchMoreData,
  };
};

import type { CommentRecord } from '~/types/comments';

interface CommentCache {
  items: CommentRecord[];
  total: number;
}
const COMMENT_CACHE = new Map<string, CommentCache>();
const MAX_CACHE_SIZE = 15;

export const useComments = (postId: string) => {
  const {
    allItems: comments,
    totalItems,
    isLoadingMore,
    hasMore,
    isFirstLoad,
    loadMore,
    resetPagination,
  } = usePagination<CommentRecord>();

  const loading = ref(false);
  const lastLoadedPostId = ref<string | null>(null);

  /**
   * 更新全局缓存
   */
  const updateCache = () => {
    if (COMMENT_CACHE.size > MAX_CACHE_SIZE) {
      const firstKey = COMMENT_CACHE.keys().next().value;
      if (firstKey !== undefined) COMMENT_CACHE.delete(firstKey);
    }
    COMMENT_CACHE.set(postId, {
      items: [...comments.value],
      total: totalItems.value,
    });
  };

  const fetchCommentsApi = async (page: number) => {
    const res = await $fetch<any>(`/api/collections/comments`, {
      query: { post: postId, page, perPage: 10 },
    });
    const items = (res.data?.comments || []).map((c: any) => ({
      ...c,
      likes: c.likes || 0,
      isLiked: c.isLiked || false,
      relativeTime: useRelativeTime(c.created),
    }));
    return { items, total: res.data?.totalItems || 0 };
  };

  /**
   * 初始化/获取评论
   */
  const fetchComments = async (isSilent = false, forceRefresh = false) => {
    // 如果强制刷新或尚未加载过评论，则继续获取
    if (!forceRefresh && lastLoadedPostId.value === postId && comments.value.length > 0) return;

    // 检查缓存，但如果是强制刷新则跳过缓存
    const cached = COMMENT_CACHE.get(postId);
    if (cached && !isSilent && !forceRefresh) {
      resetPagination(cached.items, cached.total);
      lastLoadedPostId.value = postId; // 确保标记已加载
      return;
    }

    if (!isSilent) loading.value = true;
    try {
      const result = await fetchCommentsApi(1);
      resetPagination(result.items, result.total);
      lastLoadedPostId.value = postId;
      updateCache();
    } finally {
      loading.value = false;
    }
  };

  const handleLoadMore = () => loadMore(fetchCommentsApi);

  /**
   * 实时同步单条评论 (Create/Update/Delete)
   */
  const syncSingleComment = (record: CommentRecord, action: 'create' | 'update' | 'delete') => {
    const index = comments.value.findIndex((c) => c.id === record.id);
    if (action === 'delete' && index !== -1) {
      comments.value.splice(index, 1);
      totalItems.value = Math.max(0, totalItems.value - 1);
    } else if (action === 'create' && index === -1) {
      comments.value.unshift({
        ...record,
        likes: record.likes || 0,
        isLiked: record.isLiked || false,
        relativeTime: useRelativeTime(record.created),
      });
      totalItems.value++;
    } else if (action === 'update' && index !== -1) {
      comments.value[index] = {
        ...comments.value[index],
        ...record,
        expand: { ...(comments.value[index]?.expand || {}), ...(record.expand || {}) },
      };
    }
    updateCache();
  };

  /**
   * 点赞处理逻辑
   */
  const handleLikeChange = (liked: boolean, likes: number, commentId: string, isFromRealtime = false) => {
    const target = comments.value.find((c) => c.id === commentId);
    if (target) {
      target.likes = likes;
      if (!isFromRealtime) target.isLiked = liked;
      updateCache(); // 点赞后必须更新缓存，否则切回来数据会回滚
    }
  };

  /**
   * 获取参与用户列表
   */
  const getUniqueUsers = () => {
    const usersMap = new Map();
    comments.value.forEach((c) => {
      const u = c.expand?.user;
      if (u) usersMap.set(u.id, { id: u.id, name: u.name, avatar: u.avatar, location: u.location });
    });
    return Array.from(usersMap.values());
  };

  return {
    comments,
    totalItems,
    loading,
    isLoadingMore,
    hasMore,
    isFirstLoad,
    fetchComments,
    handleLoadMore,
    syncSingleComment,
    handleLikeChange,
    getUniqueUsers,
  };
};

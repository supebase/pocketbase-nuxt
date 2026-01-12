import type { CommentRecord } from '~/types/comments';

// --- 修改：全局评论缓存池 ---
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
    loadMore,
    resetPagination,
  } = usePagination<CommentRecord>();

  const loading = ref(false);
  const lastLoadedPostId = ref<string | null>(null);

  // --- 修改：内部更新缓存方法 ---
  const updateCache = () => {
    if (COMMENT_CACHE.size > MAX_CACHE_SIZE) {
      // 获取迭代器的第一个值
      const firstKey = COMMENT_CACHE.keys().next().value;

      // --- 修复：增加类型守卫，确保 firstKey 存在 ---
      if (firstKey !== undefined) {
        COMMENT_CACHE.delete(firstKey);
      }
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

  const fetchComments = async (isSilent = false) => {
    // --- 修改：如果已经加载过且 postId 没变，直接返回 ---
    if (lastLoadedPostId.value === postId && comments.value.length > 0) return;

    // --- 修改：检查缓存 ---
    const cached = COMMENT_CACHE.get(postId);
    if (cached && !isSilent) {
      resetPagination(cached.items, cached.total);
      lastLoadedPostId.value = postId;
      return;
    }

    if (!isSilent) loading.value = true;
    try {
      const result = await fetchCommentsApi(1);
      resetPagination(result.items, result.total);
      lastLoadedPostId.value = postId;
      updateCache(); // 写入缓存
    } finally {
      loading.value = false;
    }
  };

  const handleLoadMore = () => loadMore(fetchCommentsApi);

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
    updateCache(); // 同步动作后更新缓存
  };

  const handleLikeChange = (
    liked: boolean,
    likes: number,
    commentId: string,
    isFromRealtime = false,
  ) => {
    const target = comments.value.find((c) => c.id === commentId);
    if (target) {
      target.likes = likes;
      if (!isFromRealtime) target.isLiked = liked;
      updateCache(); // 点赞后更新缓存
    }
  };

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
    fetchComments,
    handleLoadMore,
    syncSingleComment,
    handleLikeChange,
    getUniqueUsers,
  };
};

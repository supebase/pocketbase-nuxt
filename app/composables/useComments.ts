import type { CommentRecord, CommentCache } from '~/types';

const MAX_CACHE_SIZE = 15;
const COMMENT_CACHE = new Map<string, CommentCache>();
const POST_PARTICIPANTS = new Map<string, Map<string, any>>();

const pruneCache = () => {
  if (COMMENT_CACHE.size > MAX_CACHE_SIZE) {
    const firstKey = COMMENT_CACHE.keys().next().value;
    if (firstKey !== undefined) {
      COMMENT_CACHE.delete(firstKey);
      POST_PARTICIPANTS.delete(firstKey);
    }
  }
};

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

  const getParticipantsMap = () => {
    let participants = POST_PARTICIPANTS.get(postId);
    if (!participants) {
      participants = new Map();
      POST_PARTICIPANTS.set(postId, participants);
    }
    return participants;
  };

  const updateCache = () => {
    // 深度克隆数据以防止引用污染
    COMMENT_CACHE.set(postId, {
      items: [...comments.value],
      total: totalItems.value,
    });
    pruneCache();
  };

  const fetchCommentsApi = async (page: number, signal?: AbortSignal) => {
    const res = await $fetch<any>(`/api/collections/comments`, {
      query: { post: postId, page, perPage: 10 },
      signal, // 竞态修复：透传信号
    });

    const rawItems = res.data?.comments || [];
    const participants = getParticipantsMap();

    rawItems.forEach((c: any) => {
      const u = c.expand?.user;
      if (u && !participants.has(u.id)) {
        participants.set(u.id, { id: u.id, name: u.name, avatar: u.avatar });
      }
    });

    const items = rawItems.map((c: any) => ({
      ...c,
      likes: c.likes || 0,
      isLiked: c.isLiked || false,
      relativeTime: useRelativeTime(c.created),
    }));
    return { items, total: res.data?.totalItems || 0 };
  };

  const fetchComments = async (isSilent = false, forceRefresh = false) => {
    if (!forceRefresh && lastLoadedPostId.value === postId && comments.value.length > 0) return;

    const cached = COMMENT_CACHE.get(postId);
    // 如果是切换回该帖子且有缓存，立即恢复
    if (cached && !isSilent && !forceRefresh) {
      resetPagination(cached.items, cached.total);
      lastLoadedPostId.value = postId;
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
   * SSE 联动：确保实时更新直接写入缓存，实现“无感刷新”
   */
  const syncSingleComment = (record: CommentRecord, action: 'create' | 'update' | 'delete') => {
    const index = comments.value.findIndex((c) => c.id === record.id);

    // 1. 参与者数据原子更新
    if ((action === 'create' || action === 'update') && record.expand?.user) {
      const u = record.expand.user;
      getParticipantsMap().set(u.id, { id: u.id, name: u.name, avatar: u.avatar });
    }

    // 2. 内存列表更新
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

    // 3. 强一致性同步：将 SSE 结果同步到单例 Map
    updateCache();
  };

  const handleLikeChange = (liked: boolean, likes: number, commentId: string, isFromRealtime = false) => {
    const target = comments.value.find((c) => c.id === commentId);
    if (target) {
      target.likes = likes;
      if (!isFromRealtime) target.isLiked = liked;
      updateCache(); // 同步缓存
    }
  };

  const getUniqueUsers = () => Array.from(getParticipantsMap().values());

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

import type { CommentRecord, CommentCache, EnhancedCommentCache } from '~/types';
import { CACHE_TTL, MAX_CACHE_SIZE } from '~/constants/markdown';

const COMMENT_CACHE = new Map<string, EnhancedCommentCache>();
const POST_PARTICIPANTS = new Map<string, Map<string, any>>();

const pruneCache = () => {
  const now = Date.now();

  // 1. 首先清理过期数据
  for (const [key, value] of COMMENT_CACHE.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      COMMENT_CACHE.delete(key);
      POST_PARTICIPANTS.delete(key);
    }
  }

  // 2. 如果清理后依然超过大小限制，删除最旧的（利用 Map 的插入顺序）
  while (COMMENT_CACHE.size > MAX_CACHE_SIZE) {
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
    // 模拟 LRU：删除旧 Key 再重新插入，确保它变成 Map 的最后一个元素（最新）
    if (COMMENT_CACHE.has(postId)) {
      COMMENT_CACHE.delete(postId);
    }

    COMMENT_CACHE.set(postId, {
      items: [...comments.value],
      total: totalItems.value,
      timestamp: Date.now(), // 记录存入时间
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
        participants.set(u.id, { id: u.id, name: u.name, avatar: u.avatar, avatar_github: u.avatar_github });
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

    // 检查缓存是否存在且未过期
    if (cached && !isSilent && !forceRefresh) {
      const isExpired = Date.now() - cached.timestamp > CACHE_TTL;

      if (!isExpired) {
        // 命中有效缓存，更新其位置（LRU）
        COMMENT_CACHE.delete(postId);
        COMMENT_CACHE.set(postId, cached);

        resetPagination(cached.items, cached.total);
        lastLoadedPostId.value = postId;
        return;
      } else {
        // 缓存已过期，主动清理
        COMMENT_CACHE.delete(postId);
        POST_PARTICIPANTS.delete(postId);
      }
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
      getParticipantsMap().set(u.id, { id: u.id, name: u.name, avatar: u.avatar, avatar_github: u.avatar_github });
    }

    // 2. 内存列表更新
    if (action === 'delete' && index !== -1) {
      const targetComment = comments.value[index];
      const userId = targetComment?.user;

      comments.value.splice(index, 1);
      totalItems.value = Math.max(0, totalItems.value - 1);

      if (userId && !comments.value.some((c) => c.user === userId)) {
        getParticipantsMap().delete(userId);
      }
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

import type { CommentRecord } from '~/types/comments';

export const useComments = (postId: string) => {
  // 1. 基础分页状态
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

  // 2. 内部 API 请求函数
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

  // 3. 供外部调用的方法
  const fetchComments = async (isSilent = false) => {
    if (!isSilent && lastLoadedPostId.value === postId && comments.value.length > 0) return;
    if (!isSilent) loading.value = true;
    try {
      const result = await fetchCommentsApi(1);
      resetPagination(result.items, result.total);
      lastLoadedPostId.value = postId;
    } finally {
      loading.value = false;
    }
  };

  const handleLoadMore = () => loadMore(fetchCommentsApi);

  // 4. 同步动作 (Actions)
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
  };

  const handleLikeChange = (
    liked: boolean,
    likes: number,
    commentId: string,
    isFromRealtime = false
  ) => {
    const target = comments.value.find((c) => c.id === commentId);
    if (target) {
      target.likes = likes;
      if (!isFromRealtime) target.isLiked = liked;
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

import type { RefreshState } from '~/types';

export function useRefresh() {
  const isRefreshing = ref(false);
  const isResetting = ref(false);

  const initializeRefresh = () => {
    isRefreshing.value = true;
    isResetting.value = true;
  };

  const completeRefresh = (delay: number = 300) => {
    setTimeout(() => {
      isRefreshing.value = false;
      isResetting.value = false;
    }, delay);
  };

  /**
   * 刷新文章列表并同步更新缓存
   * 优化：增强了异常处理和缓存更新的并发控制
   */
  const refreshPostsAndComments = async (
    refreshPosts: () => Promise<void>,
    postsRef: Ref<any[]>,
    currentPage: Ref<number>,
  ) => {
    // 防止重复触发刷新
    if (isRefreshing.value) return;

    try {
      initializeRefresh();

      // 1. 执行主刷新逻辑（刷新文章列表）
      await refreshPosts();

      // 2. 缓存一致性：批量刷新评论缓存
      // 采用 Promise.allSettled 以防其中某个 ID 失效导致整体中断
      if (postsRef.value && Array.isArray(postsRef.value)) {
        const refreshTasks = postsRef.value.map((post) => refreshNuxtData(`comments-data-${post.id}`));
        await Promise.allSettled(refreshTasks);
      }

      // 3. 重置页码状态
      currentPage.value = 1;
    } catch (err) {
      // 可以在此处添加全局通知逻辑，例如：useToast().error('刷新失败')
      throw err;
    } finally {
      completeRefresh();
    }
  };

  return {
    isRefreshing,
    isResetting,
    initializeRefresh,
    completeRefresh,
    refreshPostsAndComments,
  };
}

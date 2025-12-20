/**
 * 管理刷新状态的返回类型
 */
export interface RefreshState {
  isRefreshing: Ref<boolean>;
  isResetting: Ref<boolean>;
}

/**
 * 创建刷新状态管理
 * @returns 刷新状态和刷新方法
 */
export function useRefresh() {
  const isRefreshing = ref(false);
  const isResetting = ref(false);

  /**
   * 初始化刷新状态
   */
  const initializeRefresh = () => {
    isRefreshing.value = true;
    isResetting.value = true;
  };

  /**
   * 完成刷新状态
   * @param delay 延迟时间（毫秒），用于给 CSS 动画留出时间
   */
  const completeRefresh = (delay: number = 300) => {
    setTimeout(() => {
      isRefreshing.value = false;
      isResetting.value = false;
    }, delay);
  };

  /**
   * 刷新文章列表并同时刷新所有帖子的评论数据缓存
   * @param refreshPosts 刷新文章的函数
   * @param posts 文章列表
   * @param currentPage 当前页码引用
   */
  const refreshPostsAndComments = async (
    refreshPosts: () => Promise<void>,
    postsRef: Ref<any[]>,
    currentPage: Ref<number>
  ) => {
    if (isRefreshing.value) return;

    try {
      initializeRefresh();

      // 1. 刷新文章
      await refreshPosts();

      // 2. 强制刷新所有帖子的评论数据缓存
      // 注意：用 refresh 而不是 clear，这样能确保正在显示的组件重新进入 pending
      if (postsRef.value && Array.isArray(postsRef.value)) {
        postsRef.value.forEach((post) => {
          refreshNuxtData(`comments-data-${post.id}`);
        });
      }

      // 3. 重置页码
      currentPage.value = 1;
    } catch (err) {
      console.error('刷新失败:', err);
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

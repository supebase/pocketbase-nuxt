import type { PostItem } from '~/types';

export function usePostsActions(refreshCallback: () => Promise<void> | void) {
  const isDeleteModalOpen = ref(false);
  const isDeleting = ref(false);
  // 指定类型
  const pendingDeleteItem = ref<PostItem | null>(null);
  const toast = useToast();

  const handleRequestDelete = (item: PostItem) => {
    pendingDeleteItem.value = item;
    isDeleteModalOpen.value = true;
  };

  const confirmDelete = async () => {
    const targetId = pendingDeleteItem.value?.id;
    if (!targetId) return;

    isDeleting.value = true;

    try {
      // 1. 执行删除请求
      await $fetch(`/api/collections/post/${targetId}`, { method: 'DELETE' });

      // 2. 成功处理
      isDeleteModalOpen.value = false;
      toast.add({
        title: '删除成功',
        icon: 'i-hugeicons:checkmark-circle-03',
        color: 'success',
      });

      // 3. 触发刷新 (不 block 最后的清理逻辑)
      if (refreshCallback) await refreshCallback();
    } catch (err: any) {
      // 4. 失败处理
      toast.add({
        title: '删除失败',
        description: err.data?.message || '未知错误',
        icon: 'i-hugeicons:alert-02',
        color: 'error',
      });
    } finally {
      // 5. 状态清理
      isDeleting.value = false;
    }
  };

  const onModalTransitionEnd = () => {
    pendingDeleteItem.value = null;
  };

  return {
    isDeleteModalOpen,
    isDeleting,
    pendingDeleteItem,
    handleRequestDelete,
    confirmDelete,
    onModalTransitionEnd,
  };
}

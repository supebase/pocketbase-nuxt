export function usePostsActions(refreshCallback: () => Promise<any>) {
  const isDeleteModalOpen = ref(false);
  const isDeleting = ref(false);
  const pendingDeleteItem = ref<any>(null);
  const toast = useToast();

  const handleRequestDelete = (item: any) => {
    pendingDeleteItem.value = item;
    isDeleteModalOpen.value = true;
  };

  const confirmDelete = async () => {
    if (!pendingDeleteItem.value) return;
    isDeleting.value = true;
    try {
      await $fetch(`/api/collections/post/${pendingDeleteItem.value.id}`, {
        method: 'DELETE',
      });
      isDeleteModalOpen.value = false;
      toast.add({
        title: '删除成功',
        icon: 'i-hugeicons:checkmark-circle-03',
        color: 'success',
      });
      // 删除成功后调用刷新
      await refreshCallback();
    } catch (err: any) {
      toast.add({
        title: '删除失败',
        description: err.data?.message,
        icon: 'i-hugeicons:alert-02',
        color: 'error',
      });
    } finally {
      isDeleting.value = false;
      setTimeout(() => {
        pendingDeleteItem.value = null;
      }, 200);
    }
  };

  return {
    isDeleteModalOpen,
    isDeleting,
    pendingDeleteItem,
    handleRequestDelete,
    confirmDelete,
  };
}

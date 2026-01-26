import { useClipboard, useShare } from '@vueuse/core';

export const usePostsMenu = (item: { id: string; cleanContent?: string }) => {
  const toast = useToast();
  const { copy, isSupported } = useClipboard();
  const { share } = useShare();

  const handleCopy = async () => {
    if (!isSupported.value) {
      toast.add({
        title: '发生错误',
        description: '浏览器不支持剪贴板',
        color: 'error',
      });
      return;
    }
    // 使用 import.meta.client 确保安全
    const origin = import.meta.client ? window.location.origin : '';
    await copy(`${origin}/${item.id}`);
    toast.add({
      title: '复制成功',
      icon: 'i-hugeicons:checkmark-circle-03',
      color: 'success',
    });
  };

  const handleShare = async () => {
    try {
      await share({
        text: item.cleanContent || '',
        url: import.meta.client ? location.href : '',
      });
    } catch (err) {
      // 捕获取消分享或不支持的情况
    }
  };

  const showAuthToast = (description: string, title: string = '权限不足') => {
    toast.add({
      title,
      description,
      icon: 'i-hugeicons:alert-02',
      color: 'warning',
    });
  };

  return {
    handleCopy,
    handleShare,
    showAuthToast,
  };
};

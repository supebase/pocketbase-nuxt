<template>
  <UDropdownMenu arrow size="lg" :ui="{ item: 'cursor-pointer' }" :items="dropdownItems">
    <Icon
      name="i-hugeicons:more-horizontal"
      class="size-5 text-dimmed cursor-pointer hover:text-primary transition-colors"
    />
  </UDropdownMenu>
</template>

<script setup lang="ts">
import { useClipboard, useShare } from '@vueuse/core';
import { isClient } from '@vueuse/shared';

interface Props {
  isLogined: boolean;
  item: {
    id: string;
    cleanContent?: string;
  };
  canViewDrafts: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['requestEdit', 'requestDelete']);

const toast = useToast();

const { copy, isSupported } = useClipboard();
const { share } = useShare();

const shareButton = (text: string) => {
  if (isSupported) {
    return share({
      text: text,
      url: isClient ? location.href : '',
    }).catch((err) => err);
  }
};

const showAuthToast = () => {
  toast.add({
    title: '权限不足',
    description: '只有已认证用户可以进行此操作',
    icon: 'i-hugeicons:alert-02',
    color: 'warning',
  });
};

const withAuth = (action: () => void) => {
  return () => (props.canViewDrafts ? action() : showAuthToast());
};

const authItem = (config: any) => ({
  ...config,
  class: !props.canViewDrafts ? 'opacity-50 cursor-not-allowed' : '',
  onClick: withAuth(config.onClick),
});

const handleCopy = async () => {
  if (!isSupported.value) {
    toast.add({ title: '发生错误', description: '浏览器不支持剪贴板', color: 'error' });
    return;
  }
  await copy(`${window.location.origin}/${props.item.id}`);
  toast.add({ title: '复制成功', icon: 'i-hugeicons:checkmark-circle-03', color: 'success' });
};

const dropdownItems = computed(() => {
  const commonSection = [
    {
      label: '复制链接',
      icon: 'i-hugeicons:link-02',
      onClick: handleCopy,
    },
    {
      label: '发送分享',
      icon: 'i-hugeicons:share-08',
      onClick: () => shareButton(props.item.cleanContent || ''),
    },
  ];

  if (!props.isLogined) {
    return [commonSection, [{ icon: 'i-hugeicons:lock-key', label: '请先登录', onClick: () => navigateTo('/auth') }]];
  }

  return [
    commonSection,
    [
      authItem({
        label: '重新编辑',
        icon: 'i-hugeicons:edit-04',
        onClick: () => {
          setTimeout(() => {
            navigateTo(`/edit/${props.item.id}`);
          }, 100);
        },
      }),
      authItem({
        label: '永久删除',
        icon: 'i-hugeicons:delete-01',
        color: 'error' as const,
        onClick: () => emit('requestDelete', props.item),
      }),
    ],
  ];
});
</script>

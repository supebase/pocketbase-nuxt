<template>
  <UDropdownMenu
    arrow
    size="lg"
    :ui="{ item: 'cursor-pointer' }"
    :content="{
      align: 'start',
      side: 'bottom',
      sideOffset: 8,
    }"
    :items="dropdownItems"
  >
    <Icon
      name="i-hugeicons:more-horizontal"
      class="size-5 text-dimmed cursor-pointer hover:text-primary transition-colors"
    />
  </UDropdownMenu>
</template>

<script setup lang="ts">
interface Props {
  isLogined: boolean;
  item: {
    id: string;
    user: string;
    cleanContent?: string;
  };
  canViewDrafts: boolean;
  currentUserId?: string;
}

interface Item {
  id: string;
  cleanContent?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  requestDelete: [item: Item];
}>();

const { handleCopy, handleShare, showAuthToast } = usePostsMenu(props.item);

const performAction = (action: () => void) => {
  requestAnimationFrame(() => {
    setTimeout(action, 150);
  });
};

const isAuthor = computed(() => props.isLogined && props.currentUserId === props.item.user);

const authItem = (config: any) => {
  const hasPermission = isAuthor.value;

  return {
    ...config,
    class: !hasPermission ? 'opacity-50 cursor-not-allowed' : '',
    onClick: () => {
      if (!props.isLogined) {
        showAuthToast('请先登录后再进行操作', '需要身份认证');
      } else if (!hasPermission) {
        showAuthToast('只有内容的所有者可以进行此操作', '无权操作');
      } else {
        config.onClick();
      }
    },
  };
};

const dropdownItems = computed(() => {
  const common = [
    {
      label: '复制链接',
      icon: 'i-hugeicons:link-02',
      onClick: handleCopy,
    },
    {
      label: '发送分享',
      icon: 'i-hugeicons:share-08',
      onClick: handleShare,
    },
  ];

  if (!props.isLogined) {
    return common;
  }

  return [
    common,
    [
      authItem({
        label: '重新编辑',
        icon: 'i-hugeicons:edit-04',
        onClick: () => performAction(() => navigateTo(`/edit/${props.item.id}`)),
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

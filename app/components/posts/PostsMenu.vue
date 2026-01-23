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
    cleanContent?: string;
  };
  canViewDrafts: boolean;
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

const authItem = (config: any) => ({
  ...config,
  class: !props.canViewDrafts ? 'opacity-50 cursor-not-allowed' : '',
  onClick: () => (props.canViewDrafts ? config.onClick() : showAuthToast()),
});

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
    return [
      common,
      [
        {
          icon: 'i-hugeicons:lock-key',
          label: '请先登录',
          onClick: () => navigateTo('/auth'),
        },
      ],
    ];
  }

  return [
    common,
    [
      authItem({
        label: '重新编辑',
        icon: 'i-hugeicons:edit-04',
        onClick: () => setTimeout(() => navigateTo(`/edit/${props.item.id}`), 300),
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

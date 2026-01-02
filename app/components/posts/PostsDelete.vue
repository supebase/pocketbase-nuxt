<template>
  <UDropdownMenu
    arrow
    size="lg"
    :ui="{ item: 'cursor-pointer' }"
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

  const props = defineProps<Props>();
  const emit = defineEmits(['requestEdit', 'requestDelete']);

  const toast = useToast();

  const showAuthToast = () => {
    toast.add({
      title: '权限不足',
      description: '只有已认证用户可以进行此操作',
      icon: 'i-hugeicons:alert-02',
      color: 'warning',
    });
  };

  const dropdownItems = computed(() => {
    // 未登录逻辑
    if (!props.isLogined) {
      return [
        [
          {
            icon: 'i-hugeicons:lock-key',
            label: '请先登录',
            onClick: () => navigateTo(`/auth`),
          },
        ],
      ];
    }

    // 已登录逻辑：不再自己处理逻辑，而是通知父组件
    return [
      [
        {
          icon: 'i-hugeicons:edit-04',
          label: '编辑',
          onClick: () => {
            if (props.canViewDrafts) {
              navigateTo(`/edit/${props.item.id}`);
            } else {
              showAuthToast();
            }
          },
        },
        {
          icon: 'i-hugeicons:delete-01',
          label: '删除',
          color: 'error' as const,
          onClick: () => {
            if (props.canViewDrafts) {
              // 触发父组件的删除请求事件
              emit('requestDelete', props.item);
            } else {
              showAuthToast();
            }
          },
        },
      ],
    ];
  });
</script>

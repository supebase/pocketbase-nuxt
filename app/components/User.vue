<template>
  <UModal
    v-model:open="isOpen"
    :dismissible="false"
    :title="showAuth ? '登录账户或注册新账号' : '欢迎回来'"
    :description="
      showAuth
        ? '登录现有账户，或快速注册获取评论权限。'
        : '您可以更新个人资料、更改密码等。'
    "
    close-icon="hugeicons:cancel-01">
    <UUser
      size="lg"
      :avatar="userAvatar" />
    <template #body>
      <Auth v-if="showAuth" :close-modal="closeModal" />
      <Profile v-else :close-modal="closeModal" />
    </template>
  </UModal>
</template>

<script setup>
const { isAuthenticated, currentUser } = useAuth();
const { getAvatarUrl } = useAvatar();

// 控制UModal显示和隐藏的状态
const isOpen = ref(false);
// 控制显示Auth还是Profile组件的状态
const showAuth = ref(!isAuthenticated.value);

// 关闭UModal的方法
const closeModal = () => {
  isOpen.value = false;
};

// 监听isAuthenticated变化，更新showAuth状态
watch(
  () => isAuthenticated.value,
  (newVal) => {
    // 只有当模态框打开时，才更新showAuth状态
    if (isOpen.value) {
      showAuth.value = !newVal;
    }
  }
);

// 监听isOpen变化，当模态框打开时，初始化showAuth状态
watch(
  () => isOpen.value,
  (newVal) => {
    if (newVal) {
      showAuth.value = !isAuthenticated.value;
    }
  }
);

// 计算UUser组件的avatar属性，确保响应式更新
const userAvatar = computed(() => {
  if (isAuthenticated.value && currentUser.value) {
    const avatarUrl = getAvatarUrl(currentUser.value);
    return {
      src: avatarUrl,
      alt: currentUser.value.name || currentUser.value.email,
      class: 'w-8 h-8 rounded-full uppercase cursor-pointer',
      // 添加一个唯一的key，确保每次头像变化时，UUser组件都会重新渲染
      key: avatarUrl ? `${avatarUrl}-${Date.now()}` : 'default-avatar'
    };
  }
  return {
    icon: 'hugeicons:lock-key',
    class: 'w-8 h-8 rounded-full cursor-pointer',
    key: 'default-avatar'
  };
});
</script>

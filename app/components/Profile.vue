<template>
  <UCard class="w-full max-w-md mx-auto">
    <div class="text-center space-y-4">
      <!-- 用户头像 -->
      <AvatarManager :user="currentUser" />
      
      <!-- 用户信息 -->
      <div class="space-y-2">
        <h3 class="text-xl font-semibold">{{ currentUser?.name || currentUser?.email.split('@')[0] }}</h3>
        <p class="text-gray-500">{{ currentUser?.email }}</p>
        <UChip 
          :color="currentUser?.verified ? 'success' : 'warning'" 
          size="sm"
        >
          {{ currentUser?.verified ? '已认证' : '未认证' }}
        </UChip>
      </div>
      
      <!-- 退出登录按钮 -->
      <UButton
        icon="hugeicons:logout-circle-01"
        @click="handleLogout"
        color="error"
        variant="outline"
        block
      >
        安全退出
      </UButton>
    </div>
  </UCard>
</template>

<script setup lang="ts">
const props = defineProps<{
  closeModal: () => void;
}>();

const { currentUser, logout } = useAuth();

// 处理退出登录，先关闭模态框再执行退出登录
const handleLogout = async () => {
  props.closeModal();
  logout();
};
</script>
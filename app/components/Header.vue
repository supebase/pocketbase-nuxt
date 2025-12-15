<template>
  <div>
    <div class="flex items-center gap-3">
      <!-- 未登录状态 -->
      <UButton
        to="/auth"
        color="neutral"
        variant="link"
        icon="hugeicons:lock-key"
        class="rounded-full"
        v-if="!loggedIn" />

      <!-- 已登录状态 -->
      <div
        class="flex items-center gap-3"
        v-else>
        <UUser
          :name="user?.name"
          size="sm"
          :avatar="{
            src: `https://gravatar.loli.net/avatar/${user?.avatar}?s=64&r=G`,
            icon: 'hugeicons:image-03',
          }" />
        <USeparator
          orientation="vertical"
          class="h-6 ml-2" />
        <UButton
          to="/new"
          color="neutral"
          variant="link"
          icon="i-hugeicons:add-circle"
          class="rounded-full"
          v-if="user?.verified" />
        <LogoutButton />
      </div>
      <ColorModeButton />
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, loggedIn } = useUserSession();
</script>

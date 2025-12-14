<template>
  <div>
    <h1>欢迎使用 Nuxt + PocketBase 认证系统</h1>
    <div v-if="loggedIn && user">
      <p>
        您已登录，<img
          :src="`https://cn.cravatar.com/avatar/${user.avatar}?s=64&r=G`"
          style="width: 32px; border-radius: 50%" />
        ({{ user.email }})
      </p>
      <p>用户 ID：**{{ user.id }}**</p>

      <LogoutButton />
    </div>
    <div v-else>
      <p>您尚未登录。</p>
      <NuxtLink to="/auth">去登录/注册</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, loggedIn } = useUserSession();
</script>

<template>
  <UCard
    variant="subtle"
    class="mx-auto max-w-md">
    <UTabs
      :items="items"
      :ui="{ trigger: 'grow cursor-pointer' }"
      variant="link"
      color="primary"
      class="w-full gap-4">
      <template #content="{ item }">
        <UAlert
          :title="item.description"
          variant="outline"
          color="neutral" />
        <AuthForm :is-login-mode="item.content === 'login' ? true : false" />
      </template>
    </UTabs>
  </UCard>
</template>

<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui";

const items: TabsItem[] = [
  {
    label: "登录我的账户",
    icon: "hugeicons:login-02",
    content: "login",
    description: "使用电子邮件和密码登录到您的账户。",
  },
  {
    label: "免费创建账户",
    icon: "hugeicons:user-add-01",
    content: "register",
    description: "创建一个新账户，完成后即可自动登录。",
  },
];
</script>

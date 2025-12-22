<template>
  <UCard variant="subtle" class="mx-auto max-w-md select-none">
    <UTabs v-model="activeTab" :items="items" :content="false"
      :ui="{ trigger: 'grow cursor-pointer' }" variant="link" size="lg" color="primary"
      class="w-full gap-4" />

    <div class="mt-4 space-y-4">
      <UAlert :title="currentTabItem?.description" variant="outline" color="neutral" />

      <AuthForm :key="activeTab" :is-login-mode="activeTab === 'login'" />
    </div>
  </UCard>
</template>

<script setup lang="ts">
const route = useRoute();
const router = useRouter();

const items = [
  {
    label: "登录我的账户",
    icon: "i-hugeicons:login-02",
    value: "login",
    description: "使用电子邮件和密码登录到您的账户。",
  },
  {
    label: "免费创建账户",
    icon: "i-hugeicons:user-add-01",
    value: "register",
    description: "创建一个新账户，完成后即可自动登录。",
  },
];

const activeTab = computed({
  get() {
    // 退出后默认显示登录
    return (route.query.tab as string) || "login";
  },
  set(val) {
    // 当点击 Tab 时，更新 URL 参数
    router.replace({
      query: { ...route.query, tab: val },
    });
  },
});

// 获取当前选中的配置项
const currentTabItem = computed(() => items.find((i) => i.value === activeTab.value));
</script>

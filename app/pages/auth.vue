<template>
  <UCard
    variant="subtle"
    class="mx-auto max-w-md select-none bg-white/60 dark:bg-neutral-900/60 backdrop-blur"
  >
    <UTabs
      v-model="activeTab"
      :items="TABS"
      :content="false"
      :ui="{ trigger: 'grow cursor-pointer' }"
      variant="link"
      size="lg"
      color="primary"
      class="w-full gap-4"
    />

    <div class="mt-4 space-y-4">
      <UAlert
        v-if="currentTabConfig"
        :title="currentTabConfig.description"
        variant="outline"
        color="neutral"
      />

      <AuthForm :key="activeTab" :is-login-mode="activeTab === 'login'" />
    </div>
  </UCard>
</template>

<script setup lang="ts">
  // 1. 将配置提取出来，属性名改用 value
  const TABS = [
    {
      label: '登录我的账户',
      icon: 'i-hugeicons:login-02',
      value: 'login',
      description: '使用电子邮件和密码登录到您的账户。',
    },
    {
      label: '免费创建账户',
      icon: 'i-hugeicons:user-add-01',
      value: 'register',
      description: '创建一个新账户，完成后即可自动登录。',
    },
  ];

  const route = useRoute();
  const router = useRouter();

  // 2. 响应式同步路由
  const activeTab = computed({
    get() {
      const queryTab = route.query.tab as string;
      // 检查 URL 参数是否合法，不合法默认显示 login
      return TABS.some((t) => t.value === queryTab) ? queryTab : 'login';
    },
    set(val) {
      // 切换时更新 URL，使用 replace 避免污染浏览器后退历史
      router.replace({
        query: { ...route.query, tab: val },
      });
    },
  });

  // 3. 基于 activeTab 获取当前配置
  const currentTabConfig = computed(() =>
    TABS.find((t) => t.value === activeTab.value),
  );
</script>

<template>
  <div class="grid gap-4 md:grid-cols-3 p-4 font-sans select-none">
    <UCard
      v-for="item in displayStats"
      :key="item.label"
      :ui="{
        root: 'bg-white/90 dark:bg-neutral-950/50 backdrop-blur-sm shadow-xs ring-0',
        body: 'p-3.5!',
      }"
    >
      <div class="flex items-center justify-between pb-2">
        <h3 class="text-sm font-medium">{{ item.label }}</h3>
        <UIcon :name="item.icon" class="size-4 text-dimmed/80" />
      </div>

      <div class="text-2xl font-bold tabular-nums">{{ item.value }}</div>

      <div class="mt-1 flex items-center justify-between min-h-5">
        <p class="text-xs text-dimmed">{{ item.desc }}</p>

        <UBadge
          v-if="item.growth !== undefined && item.growth !== 0"
          :color="item.growth > 0 ? 'success' : 'error'"
          variant="soft"
          size="xs"
        >
          {{ item.growth > 0 ? '+' : '' }}{{ item.growth }}%
          {{ item.growth > 0 ? '↑' : '↓' }}
        </UBadge>
        <span v-else-if="item.growth === 0" class="text-xs text-dimmed">持平</span>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const { data: response } = await useFetch<{ data: any }>(`/api/stats/users`, {
  query: { t: Date.now() },
});

const stats = response.value?.data || {};

const growthVal = (() => {
  const { today_new_users: today = 0, yesterday_new_users: yest = 0 } = stats;
  if (yest === 0) return today > 0 ? 100 : 0;
  return Math.round(((today - yest) / yest) * 100);
})();

const displayStats = [
  {
    label: '总用户数',
    value: stats.total_users,
    icon: 'i-hugeicons:user-multiple-02',
    desc: '从创建至今的累积量',
  },
  {
    label: '今日新增',
    value: stats.today_new_users,
    icon: 'i-hugeicons:user-add-02',
    desc: '较昨日',
    growth: growthVal,
  },
  {
    label: '活跃用户',
    value: stats.active_users_30d,
    icon: 'i-hugeicons:chart-up',
    desc: '近 30 天有登录记录',
  },
];
</script>

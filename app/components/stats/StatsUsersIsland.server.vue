<template>
  <div class="grid gap-4 md:grid-cols-3 p-4 font-sans select-none">
    <div class="rounded-lg border border-neutral-200/60 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-900/60">
      <div class="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 class="tracking-tight text-sm font-medium">总用户数</h3>
        <UIcon name="i-hugeicons:user-multiple-02" class="size-4.5 text-dimmed/80" />
      </div>
      <div class="p-6 pt-0">
        <div class="text-2xl font-bold tabular-nums tracking-tight">{{ stats.total_users }}</div>
        <p class="text-xs text-dimmed mt-1">从创建至今的累积量</p>
      </div>
    </div>

    <div class="rounded-lg border border-neutral-200/60 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-900/60">
      <div class="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 class="tracking-tight text-sm font-medium">今日新增</h3>
        <UIcon name="i-hugeicons:user-add-02" class="size-4.5 text-dimmed/80" />
      </div>
      <div class="p-6 pt-0">
        <div class="text-2xl font-bold tabular-nums tracking-tight">{{ stats.today_new_users }}</div>
        <div class="flex items-center justify-between gap-1">
          <p class="text-xs text-dimmed">较昨日</p>
          <div
            :class="[
              'px-2 py-0.5 rounded text-xs font-medium',
              growth.isUp
                ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10'
                : 'text-rose-600 bg-rose-50 dark:bg-rose-500/10',
            ]"
          >
            {{ growth.text }} {{ growth.val !== 0 ? (growth.isUp ? '↑' : '↓') : '' }}
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-lg border border-neutral-200/60 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-900/60">
      <div class="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 class="tracking-tight text-sm font-medium">活跃用户</h3>
        <UIcon name="i-hugeicons:chart-up" class="size-4.5 text-dimmed/80" />
      </div>
      <div class="p-6 pt-0">
        <div class="text-2xl font-bold tabular-nums tracking-tight">{{ stats.active_users_30d }}</div>
        <p class="text-xs text-dimmed mt-1">近 30 天有登录记录</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const response = await $fetch<{ data: any }>('/api/stats/users');
const stats = response.data;

const growth = (() => {
  const today = stats.today_new_users || 0;
  const yesterday = stats.yesterday_new_users || 0;

  if (yesterday === 0) return { text: '持平', isUp: true, val: 0 };

  const diff = today - yesterday;
  const percent = Math.round((diff / yesterday) * 100);

  return {
    text: `${percent > 0 ? '+' : ''}${percent}%`,
    isUp: percent >= 0,
    val: percent,
  };
})();
</script>

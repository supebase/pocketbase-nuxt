<template>
  <UPopover arrow :ui="{ content: 'bg-neutral-50/80 dark:bg-neutral-950/80 backdrop-blur' }">
    <UButton
      color="neutral"
      variant="link"
      icon="i-hugeicons:user-multiple-02"
      tabindex="-1"
      class="rounded-full cursor-pointer"
    />
    <template #content>
      <div class="flex items-center justify-between px-5 pt-4 select-none">
        <div class="font-semibold text-sm text-muted">用户统计信息</div>
        <div class="flex items-center gap-1.5">
          <span v-if="isCoolingDown" class="text-xs font-mono tabular-nums text-dimmed animate-pulse">
            {{ cooldown }}s
          </span>

          <UIcon
            class="size-4 transition-all duration-300"
            :class="[
              isCoolingDown
                ? 'text-dimmed opacity-40 cursor-not-allowed rotate-180'
                : 'text-dimmed cursor-pointer hover:text-primary hover:rotate-45',
            ]"
            name="i-hugeicons:refresh"
            @click="updated"
          />
        </div>
      </div>
      <div class="grid gap-4 md:grid-cols-3 p-4 font-sans select-none">
        <div class="rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900/80">
          <div class="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 class="tracking-tight text-sm font-medium">总用户数</h3>
            <UIcon name="i-hugeicons:user-multiple-02" class="size-4.5 text-dimmed/80" />
          </div>
          <div class="p-6 pt-0">
            <div class="text-2xl font-bold tabular-nums tracking-tight">
              {{ userStats?.total_users || 0 }}
            </div>
            <p class="text-xs text-dimmed mt-1">从创建至今的累积量</p>
          </div>
        </div>

        <div class="rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900/80">
          <div class="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 class="tracking-tight text-sm font-medium">今日新增</h3>
            <UIcon name="i-hugeicons:user-add-02" class="size-4.5 text-dimmed/80" />
          </div>
          <div class="p-6 pt-0">
            <div class="text-2xl font-bold tabular-nums tracking-tight">
              {{ userStats?.today_new_users || 0 }}
            </div>

            <div class="flex items-center justify-between gap-1">
              <p class="text-xs text-dimmed">较昨日</p>
              <UBadge
                size="sm"
                :class="
                  growthInfo.isUp
                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10'
                    : 'text-rose-600 bg-rose-50 dark:bg-rose-500/10'
                "
              >
                {{ growthInfo.text }}
                <span v-if="growthInfo.val !== 0">{{ growthInfo.isUp ? '↑' : '↓' }}</span>
              </UBadge>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900/80">
          <div class="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 class="tracking-tight text-sm font-medium">活跃用户</h3>
            <UIcon name="i-hugeicons:chart-up" class="size-4.5 text-dimmed/80" />
          </div>
          <div class="p-6 pt-0">
            <div class="text-2xl font-bold tabular-nums tracking-tight">
              {{ userStats?.active_users_30d || 0 }}
            </div>
            <p class="text-xs text-dimmed mt-1">近 30 天有登录记录</p>
          </div>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
interface UserStats {
  total_users: number;
  today_new_users: number;
  yesterday_new_users: number;
  active_users_30d: number;
}

interface ApiResponse {
  message: string;
  data: UserStats;
}

const { data: statsResponse, refresh } = await useFetch<ApiResponse>('/api/stats/users', {
  key: 'global-user-stats',
});

const userStats = computed(() => statsResponse.value?.data);

const growthInfo = computed(() => {
  const today = userStats.value?.today_new_users || 0;
  const yesterday = userStats.value?.yesterday_new_users || 0;

  if (yesterday === 0) return { text: '持平', isUp: true, val: 0 };

  const diff = today - yesterday;
  const percent = Math.round((diff / yesterday) * 100);

  return {
    text: `${percent > 0 ? '+' : ''}${percent}%`,
    isUp: percent >= 0,
    val: percent,
  };
});

const cooldown = ref(0);
const isCoolingDown = computed(() => cooldown.value > 0);

const updated = async () => {
  if (isCoolingDown.value) return;

  // 1. 立即执行刷新
  await refresh();

  // 2. 开启 10 秒倒计时
  cooldown.value = 10;
  const timer = setInterval(() => {
    cooldown.value--;
    if (cooldown.value <= 0) {
      clearInterval(timer);
    }
  }, 1000);
};
</script>

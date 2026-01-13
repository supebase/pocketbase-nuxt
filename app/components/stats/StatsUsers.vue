<template>
  <UPopover arrow :ui="{ content: 'bg-neutral-50/80 dark:bg-neutral-950/80 backdrop-blur' }">
    <UButton
      color="neutral"
      variant="link"
      icon="i-hugeicons:chart-01"
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
            @click="handleUpdate"
          />
        </div>
      </div>

      <NuxtIsland lazy name="StatsUsersIsland" :key="refreshKey" @rendered="isCoolingDown = false">
        <template #fallback>
          <div class="grid gap-4 md:grid-cols-3 p-4 select-none">
            <USkeleton
              v-for="i in 3"
              :key="i"
              class="h-32.5 w-39.5 animate-pulse rounded-lg border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900/80"
            />
          </div>
        </template>
      </NuxtIsland>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
const refreshKey = ref(0);
const cooldown = ref(0);
const isCoolingDown = computed(() => cooldown.value > 0);

/**
 * 恢复你之前的逻辑：
 * 1. 触发 Island 刷新 (通过改变 key)
 * 2. 开启倒计时
 */
const handleUpdate = async () => {
  if (isCoolingDown.value) return;

  // 改变 key 会让 NuxtIsland 重新发起请求获取最新 HTML
  refreshKey.value++;

  // 开启 10 秒倒计时
  cooldown.value = 10;
  const timer = setInterval(() => {
    cooldown.value--;
    if (cooldown.value <= 0) {
      clearInterval(timer);
    }
  }, 1000);
};
</script>

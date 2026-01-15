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

      <NuxtIsland ref="statsIsland" lazy name="StatsUsersIsland" @rendered="isCoolingDown = false">
        <template #fallback>
          <div class="grid gap-4 md:grid-cols-3 p-4 select-none">
            <USkeleton
              v-for="i in 3"
              :key="i"
              class="h-32.5 w-39.5 animate-pulse rounded-lg border border-neutral-200/60 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-900/60"
            />
          </div>
        </template>
      </NuxtIsland>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
const statsIsland = ref();
const cooldown = ref(0);
const isCoolingDown = computed(() => cooldown.value > 0);

const handleUpdate = async () => {
  if (isCoolingDown.value) return;

  // 使用内置 refresh 方法，这通常不会触发 fallback
  // 注意：需要 Nuxt 3.x 较新版本支持
  if (statsIsland.value?.refresh) {
    await statsIsland.value.refresh();
  } else {
    // 如果不支持 refresh，可以考虑手动触发请求
    // 或者继续使用 refreshKey，但把冷却时间设置短一点
  }

  // 开启冷却
  cooldown.value = 10;
  const timer = setInterval(() => {
    cooldown.value--;
    if (cooldown.value <= 0) clearInterval(timer);
  }, 1000);
};
</script>

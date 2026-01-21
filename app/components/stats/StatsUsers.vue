<template>
  <UPopover arrow :ui="{ content: 'bg-neutral-50/60 dark:bg-neutral-950/60 backdrop-blur' }">
    <UButton
      color="neutral"
      variant="link"
      icon="i-hugeicons:chart-01"
      tabindex="-1"
      class="rounded-full cursor-pointer"
    />

    <template #content>
      <div class="flex items-center justify-between px-5 pt-4 select-none">
        <div class="font-semibold text-sm text-muted">用户统计</div>
        <div class="flex items-center gap-1.5">
          <span v-if="isCoolingDown" class="text-xs font-mono tabular-nums text-dimmed animate-pulse">
            {{ cooldown }}s
          </span>

          <UIcon
            class="size-4 transition-all duration-300"
            :class="[
              isCoolingDown || isRefreshing
                ? 'text-dimmed opacity-40 cursor-not-allowed rotate-180'
                : 'text-dimmed cursor-pointer hover:text-primary hover:rotate-45',
              isRefreshing ? 'animate-spin' : '',
            ]"
            name="i-hugeicons:refresh"
            @click="handleUpdate"
          />
        </div>
      </div>

      <NuxtIsland ref="statsIsland" lazy name="StatsUsersIsland">
        <template #fallback>
          <div class="grid gap-3.5 md:grid-cols-3 p-3.5 select-none">
            <USkeleton
              v-for="i in 3"
              :key="i"
              class="h-29 w-34.75 animate-pulse rounded-lg bg-white/90 dark:bg-neutral-950/50 backdrop-blur-sm shadow-xs ring-0"
            />
          </div>
        </template>
      </NuxtIsland>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import { useStatsRefresh } from '~/utils/stats/use-stats-logic';

const statsIsland = ref();
const { cooldown, isRefreshing, isCoolingDown, handleUpdate } = useStatsRefresh(statsIsland);
</script>

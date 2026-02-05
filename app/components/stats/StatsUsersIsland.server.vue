<template>
  <div class="grid gap-4 md:grid-cols-3 p-4 font-sans select-none">
    <UCard
      v-for="item in displayStats"
      :key="item.label"
      :ui="{
        root: 'bg-white/90 dark:bg-neutral-800/50 backdrop-blur-sm shadow-xs ring-0 rounded-xl',
        body: 'p-3.5!',
      }"
    >
      <div class="flex items-center justify-between pb-2">
        <h3 class="text-sm font-medium">{{ item.label }}</h3>
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
import { transformStatsToDisplay } from '~/utils/stats/stats-service';

const { data: response } = await useFetch<{ data: any }>('/api/stats/users', { query: { t: Date.now() } });
const displayStats = transformStatsToDisplay(response.value?.data || {});
</script>

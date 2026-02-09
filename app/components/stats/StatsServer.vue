<template>
  <div class="w-full font-mono transition-all duration-300 select-none">
    <div v-if="isLoading && !metrics" class="py-12 flex flex-col items-center justify-center text-sm text-muted">
      <UIcon name="i-hugeicons:refresh" class="size-5 animate-spin mb-2" />
      正在获取系统指标
    </div>

    <div v-else-if="error" class="py-12 flex flex-col items-center justify-center text-sm">
      <UIcon name="i-hugeicons:alert-circle" class="size-8 text-red-500 mb-3" />
      <p class="text-red-400 font-medium">{{ error.message || '获取监控数据失败' }}</p>
      <UButton variant="ghost" @click="refresh()" class="mt-4"> 重试 </UButton>
    </div>

    <div v-else-if="metrics">
      <div class="flex justify-between items-end mb-6">
        <div>
          <div class="text-muted text-[10px] uppercase tracking-widest mb-1">Runtime Mode</div>
          <div class="font-bold text-primary flex items-center gap-2">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            {{ metrics.mode }}
          </div>
        </div>
        <div class="text-right">
          <div class="text-muted text-[10px] uppercase tracking-widest mb-1">Uptime</div>
          <div class="font-bold">{{ displayUptime }}</div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div
          class="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800"
        >
          <div class="text-xs text-muted mb-1 flex items-center gap-1">
            <UIcon name="i-hugeicons:chip" /> 内存占用 (RSS)
          </div>
          <div class="text-xl font-bold tabular-nums">{{ displayRSS }}</div>
        </div>

        <div
          class="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800"
        >
          <div class="text-xs text-muted mb-1 flex items-center gap-1">
            <UIcon name="i-hugeicons:clock-01" /> 最后采样
          </div>
          <div class="text-xl font-bold tabular-nums">{{ lastSyncTime }}</div>
        </div>
      </div>

      <div v-if="metrics.instances?.length" class="mt-8">
        <div class="text-[10px] text-muted uppercase tracking-widest mb-3 px-1">Cluster Instances</div>
        <div class="space-y-2">
          <div
            v-for="ins in metrics.instances"
            :key="ins.pm_id"
            class="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/30 border border-neutral-100 dark:border-neutral-800/50"
          >
            <div class="flex items-center gap-3">
              <div :class="[getStatusColor(ins.status), 'size-2 rounded-full shadow-sm']"></div>
              <span class="font-bold">#{{ ins.pm_id }}</span>
            </div>

            <div class="flex gap-4 items-center">
              <div class="flex flex-col items-end">
                <span class="text-[10px] text-muted scale-90">CPU</span>
                <span class="font-medium">{{ ins.cpu }}</span>
              </div>
              <div class="flex flex-col items-end min-w-16">
                <span class="text-[10px] text-muted scale-90">MEM</span>
                <span class="font-medium">{{ ins.memory }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 text-[10px] text-dimmed text-center italic">System monitor data synchronized via PM2 API</div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { metrics, isLoading, error, displayRSS, displayUptime, lastSyncTime, refresh } = useServerMetrics(5000);

const getStatusColor = (status: string) => (status === 'online' ? 'bg-green-500' : 'bg-red-500');
</script>

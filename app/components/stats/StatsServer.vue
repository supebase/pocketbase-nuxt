<template>
  <div class="w-full font-mono transition-all duration-300 select-none">
    <div v-if="isLoading && !metrics" class="py-12 flex flex-col items-center justify-center text-sm text-muted">
      <UIcon name="i-hugeicons:refresh" class="size-5 animate-spin mb-2" />
      正在获取服务器信息
    </div>

    <div v-else-if="error" class="py-12 flex flex-col items-center justify-center text-sm">
      <UIcon name="i-hugeicons:alert-circle" class="size-8 text-red-500 mb-3" />
      <p class="text-red-400 font-medium">{{ error.message || '获取数据失败' }}</p>
      <button @click="refresh()" class="mt-4 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded transition">
        重试
      </button>
    </div>

    <div v-else-if="metrics">
      <div class="flex justify-between items-start mb-6">
        <div>
          <div class="text-muted text-xs tracking-tighter">模式</div>
          <div class="font-bold text-primary">{{ metrics.mode }}</div>
        </div>
        <div class="flex gap-6 text-right">
          <div>
            <div class="text-neutral-500 text-xs tracking-tighter">在线设备</div>
            <div class="font-black text-xl">
              <CommonAnimateNumber :value="uniqueDevices" />
            </div>
          </div>
          <div>
            <div class="text-neutral-500 text-xs tracking-tighter">连接总数</div>
            <div class="font-black text-xl">
              <CommonAnimateNumber :value="totalConnections" />
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="bg-neutral-200 dark:bg-neutral-800 p-3 rounded-lg">
          <div class="text-xs text-muted mb-1 tracking-wider">总内存 (RSS)</div>
          <div class="text-lg font-semibold">{{ displayRSS }}</div>
        </div>

        <div class="bg-neutral-200 dark:bg-neutral-800 p-3 rounded-lg">
          <div class="text-xs text-muted mb-1 tracking-wider">最后同步</div>
          <div class="text-lg font-semibold">{{ lastSyncTime }}</div>
        </div>
      </div>

      <div v-if="metrics.instances?.length" class="mt-6 space-y-2">
        <div
          class="text-xs text-muted tracking-widest border-b border-neutral-200 dark:border-neutral-800 pb-1 flex justify-between"
        >
          <span>集群实例详情</span>
          <span>连接 / CPU / 内存</span>
        </div>
        <div
          v-for="ins in metrics.instances"
          :key="ins.pm_id"
          class="flex items-center justify-between text-xs py-1 px-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors"
        >
          <div class="flex items-center gap-2">
            <span :class="getStatusColor(ins.status)">●</span>
            <span class="text-muted">实例 {{ ins.pm_id }}</span>
          </div>
          <span
            class="flex-1 mx-4 border-b border-neutral-200 dark:border-neutral-800 border-dotted mb-1 opacity-20"
          ></span>
          <div class="flex gap-3">
            <span class="font-bold w-16 text-right">
              <CommonAnimateNumber :value="ins.connections" />
            </span>
            <span class="text-muted w-14 text-right">{{ ins.cpu }}</span>
            <span class="text-muted w-24 text-right">{{ ins.memory }}</span>
          </div>
        </div>
      </div>

      <div
        class="mt-6 text-[11px] text-dimmed font-mono tabular-nums flex justify-between border-t border-neutral-200 dark:border-neutral-800 pt-4"
      >
        <span>{{ metrics.status }}</span>
        <span>{{ displayUptime }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { metrics, isLoading, error, uniqueDevices, totalConnections, displayRSS, displayUptime, lastSyncTime, refresh } =
  useServerMetrics(5000);

const getStatusColor = (status: string) => (status === 'online' ? 'text-green-500' : 'text-red-500');
</script>

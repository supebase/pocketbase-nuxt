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
        class="mt-6 text-[11px] text-dimmed flex justify-between border-t border-neutral-200 dark:border-neutral-800 pt-4"
      >
        <span>状态: {{ metrics.status }}</span>
        <span>运行: {{ displayUptime }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ServerMetrics } from '~/types/common';

const {
  data: metrics,
  refresh,
  status,
  error,
} = await useFetch<ServerMetrics>('/api/metrics', {
  server: false,
  lazy: true,
});

const isLoading = computed(() => status.value === 'pending');

const totalConnections = computed(() => {
  return metrics.value?.summary?.total_active_connections ?? metrics.value?.total_connections ?? 0;
});

// 计算独立设备数
const uniqueDevices = computed(() => {
  return metrics.value?.summary?.total_unique_devices ?? metrics.value?.unique_devices ?? 0;
});

const displayRSS = computed(() => {
  // 单机模式
  if (metrics.value?.system_resource?.rss) {
    return metrics.value.system_resource.rss;
  }

  // 集群模式：累加所有实例内存
  if (metrics.value?.instances?.length) {
    const total = metrics.value.instances.reduce((acc, ins) => {
      return acc + (parseFloat(ins.memory) || 0);
    }, 0);
    return total.toFixed(2) + ' MB';
  }

  return 'N/A';
});

const lastSyncTime = computed(() => {
  const rawTime = metrics.value?.summary?.server_time;
  if (!rawTime) return new Date().toLocaleTimeString('zh-CN', { hour12: false });

  try {
    const date = new Date(rawTime);
    return date.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return new Date().toLocaleTimeString('zh-CN', { hour12: false });
  }
});

const displayUptime = computed(() => {
  // 如果是集群模式，取第一个实例的运行时间
  if (metrics.value?.instances?.[0]?.uptime) {
    return metrics.value.instances[0].uptime;
  }
  return metrics.value?.system_resource?.uptime || 'N/A';
});

const getStatusColor = (status: string) => {
  return status === 'online' ? 'text-green-500' : 'text-red-500';
};

let timer: NodeJS.Timeout | null = null;

onMounted(() => {
  // 立即刷新一次
  refresh();

  // 每5秒刷新
  timer = setInterval(() => {
    refresh();
  }, 5000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
});
</script>

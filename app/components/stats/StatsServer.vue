<template>
  <div class="w-full font-mono transition-all duration-300">
    <div v-if="isLoading && !metrics" class="py-12 flex flex-col items-center justify-center text-sm text-muted">
      <UIcon name="i-hugeicons:refresh" class="size-5 animate-spin mb-2" />
      正在获取服务器信息
    </div>

    <div v-else-if="metrics">
      <div class="flex justify-between items-start mb-6">
        <div>
          <div class="text-muted text-xs tracking-tighter">模式</div>
          <div class="text-sm font-bold text-primary">{{ metrics?.mode }}</div>
        </div>
        <div class="text-right">
          <div class="text-neutral-500 text-xs tracking-tighter">当前连接总数</div>
          <div class="font-black text-xl">
            {{ totalConnections }}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="bg-neutral-200 dark:bg-neutral-800 p-3 rounded-lg">
          <div class="text-xs text-muted mb-1 uppercase tracking-wider">总内存 (RSS)</div>
          <div class="text-lg font-semibold">{{ displayRSS }}</div>
        </div>

        <div class="bg-neutral-200 dark:bg-neutral-800 p-3 rounded-lg">
          <div class="text-xs text-muted mb-1 uppercase tracking-wider">最后同步</div>
          <div class="text-lg font-semibold truncate text-orange-500">
            {{ lastSyncTime }}
          </div>
        </div>
      </div>

      <div v-if="metrics?.instances" class="mt-6 space-y-2">
        <div
          class="text-xs text-muted uppercase tracking-widest border-b border-neutral-200 dark:border-neutral-800 pb-1 flex justify-between"
        >
          <span>集群实例详情</span>
          <span>CPU / 内存</span>
        </div>
        <div
          v-for="ins in metrics.instances"
          :key="ins.pm_id"
          class="flex items-center justify-between text-xs py-1 transition-colors px-1 rounded"
        >
          <div class="flex items-center gap-2">
            <span :class="ins.status === 'online' ? 'text-green-500' : 'text-red-500'">●</span>
            <span class="text-muted">{{ ins.pm_id }}</span>
          </div>
          <span
            class="flex-1 mx-4 border-b border-neutral-200 dark:border-neutral-800 border-dotted mb-1 opacity-20"
          ></span>
          <div class="flex gap-3">
            <span class="text-primary font-bold">{{ ins.connections }} 连接</span>
            <span class="text-muted w-14 text-right">{{ ins.cpu }}</span>
            <span class="text-muted w-24 text-right">{{ ins.memory }}</span>
          </div>
        </div>
      </div>

      <div class="mt-6 text-[10px] text-neutral-500 flex justify-between uppercase border-t border-neutral-800 pt-4">
        <span>服务器状态: {{ metrics?.status }}</span>
        <span>运行时间: {{ metrics?.system_resource?.uptime || '集群管理' }}</span>
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
} = await useFetch<ServerMetrics>('/api/metrics', {
  server: false,
  lazy: true,
});

const isLoading = computed(() => status.value === 'pending');

// --- 核心修复逻辑 ---

// 1. 统一连接数计算
const totalConnections = computed(() => {
  return metrics.value?.summary?.total_active_connections ?? metrics.value?.total_connections ?? 0;
});

// 2. 统一 RSS 内存显示：如果是集群，把所有实例的内存加起来
const displayRSS = computed(() => {
  if (metrics.value?.system_resource?.rss) {
    return metrics.value.system_resource.rss;
  }
  if (metrics.value?.instances) {
    // 累加字符串中的数字 (例如 "129.37 MB" -> 129.37)
    const total = metrics.value.instances.reduce((acc, ins) => {
      const val = parseFloat(ins.memory) || 0;
      return acc + val;
    }, 0);
    return total.toFixed(2) + ' MB';
  }
  return 'N/A';
});

// 3. 提取同步时间
// 提取并格式化同步时间
const lastSyncTime = computed(() => {
  const rawTime = metrics.value?.summary?.server_time;

  if (rawTime) {
    // 尝试将服务器返回的各种格式字符串转为 Date 对象
    const date = new Date(rawTime);

    // 如果转换成功，返回标准的中国时间格式 (例如: 22:59:24)
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('zh-CN', {
        hour12: false, // 使用 24 小时制
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    }
    // 如果 Date 转换失败，回退到原始字符串处理
    return rawTime.split(', ')[1] || rawTime;
  }

  // 兜底方案：显示本地当前时间
  return new Date().toLocaleTimeString('zh-CN', { hour12: false });
});

let timer: NodeJS.Timeout | null = null;
onMounted(() => {
  timer = setInterval(refresh, 5000);
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

import type { ServerMetrics } from '~/types/common';

export function useServerMetrics(interval: number = 5000) {
  const {
    data: metrics,
    refresh,
    status,
    error,
  } = useFetch<ServerMetrics>('/api/metrics', {
    server: false,
    lazy: true,
  });

  const isLoading = computed(() => status.value === 'pending');

  // --- 核心计算逻辑 ---
  const totalConnections = computed(() => {
    return metrics.value?.summary?.total_active_connections ?? metrics.value?.total_connections ?? 0;
  });

  const uniqueDevices = computed(() => {
    return metrics.value?.summary?.total_unique_devices ?? metrics.value?.unique_devices ?? 0;
  });

  const displayRSS = computed(() => {
    if (metrics.value?.system_resource?.rss) return metrics.value.system_resource.rss;
    if (metrics.value?.instances?.length) {
      const total = metrics.value.instances.reduce((acc, ins) => acc + (parseFloat(ins.memory) || 0), 0);
      return total.toFixed(2) + ' MB';
    }
    return 'N/A';
  });

  // --- 格式化工具 ---
  const formatDuration = (seconds: number | string) => {
    const totalSeconds = typeof seconds === 'string' ? parseInt(seconds.replace(/[^\d.]/g, '')) : seconds;

    if (!totalSeconds || isNaN(totalSeconds)) return '00s';

    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0 || d > 0) parts.push(`${h.toString().padStart(2, '0')}h`);
    if (m > 0 || h > 0 || d > 0) parts.push(`${m.toString().padStart(2, '0')}m`);
    parts.push(`${s.toString().padStart(2, '0')}s`);

    return parts.slice(-3).join(' ');
  };

  const displayUptime = computed(() => {
    const raw = metrics.value?.instances?.[0]?.uptime || metrics.value?.system_resource?.uptime;
    return raw ? formatDuration(raw) : 'N/A';
  });

  const lastSyncTime = computed(() => {
    const rawTime = metrics.value?.summary?.server_time;
    const date = rawTime ? new Date(rawTime) : new Date();
    return date.toLocaleTimeString('zh-CN', { hour12: false });
  });

  // --- 定时器逻辑 ---
  let timer: NodeJS.Timeout | null = null;

  onMounted(() => {
    refresh();
    timer = setInterval(() => refresh(), interval);
  });

  onUnmounted(() => {
    if (timer) clearInterval(timer);
  });

  return {
    metrics,
    isLoading,
    error,
    refresh,
    totalConnections,
    uniqueDevices,
    displayRSS,
    displayUptime,
    lastSyncTime,
  };
}

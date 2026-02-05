import io from '@pm2/io';
import pm2 from 'pm2';
import type { ProcessDescription } from 'pm2';

interface ConnectionInfo {
  id: string;
  clientId?: string;
  connectedAt: number;
  lastHeartbeat: number;
}

const CONFIG = {
  PROCESS_NAME: process.env.PM2_PROCESS_NAME || 'Eric',
  HEARTBEAT_TIMEOUT: 45000,
  CLEANUP_INTERVAL: 60000,
};

// 内存存储：仅存放当前进程的连接
const activeConnections = new Map<string, ConnectionInfo>();

// PM2 指标：这两个值会被 PM2 守护进程收集，供 pm2.list() 读取
const connGauge = io.metric({ name: 'Active Connections' });
const deviceGauge = io.metric({ name: 'Unique Devices' });

export const addConnection = (id: string, metadata?: { clientId?: string }): void => {
  const now = Date.now();
  activeConnections.set(id, {
    id,
    clientId: metadata?.clientId,
    connectedAt: now,
    lastHeartbeat: now,
  });
  updateGauge();
};

export const removeConnection = (id: string): void => {
  activeConnections.delete(id);
  updateGauge();
};

export const updateHeartbeat = (id: string): void => {
  const conn = activeConnections.get(id);
  if (conn) {
    conn.lastHeartbeat = Date.now();
  }
};

const updateGauge = (): void => {
  // 更新当前进程的 PM2 指标
  connGauge.set(activeConnections.size);

  const uniqueCount = new Set(
    Array.from(activeConnections.values())
      .map((c) => c.clientId)
      .filter(Boolean),
  ).size;

  deviceGauge.set(uniqueCount);
};

// 自动清理过期连接
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [id, conn] of activeConnections.entries()) {
    if (now - conn.lastHeartbeat > CONFIG.HEARTBEAT_TIMEOUT) {
      activeConnections.delete(id);
      cleaned++;
    }
  }
  if (cleaned > 0) updateGauge();
}, CONFIG.CLEANUP_INTERVAL);

const toMB = (bytes: number): string => (bytes / 1024 / 1024).toFixed(2) + ' MB';

const getInstanceMetrics = (proc: ProcessDescription) => {
  const env = proc.pm2_env as any;
  // 从 PM2 内部的 axm_monitor 中提取我们在上面定义的 Gauge 值
  const axmMonitor = env?.axm_monitor || {};

  return {
    pm_id: proc.pm_id ?? 'N/A',
    status: env?.status ?? 'unknown',
    connections: Number(axmMonitor['Active Connections']?.value || 0),
    unique_devices: Number(axmMonitor['Unique Devices']?.value || 0),
    cpu: (proc.monit?.cpu ?? 0) + '%',
    memory: toMB(proc.monit?.memory ?? 0),
    restart_count: env?.restart_time ?? 0,
    uptime: Math.floor((Date.now() - (env?.pm_uptime || Date.now())) / 1000) + 's',
  };
};

export default defineEventHandler(async (event) => {
  const isPM2 = process.env.PM2_HOME !== undefined;

  if (!isPM2) {
    const mem = process.memoryUsage();

    // 开发模式手动计算一次去重设备数
    const uniqueCount = new Set(
      Array.from(activeConnections.values())
        .map((c) => c.clientId)
        .filter(Boolean),
    ).size;

    return {
      status: 'success',
      mode: '开发环境',
      total_connections: activeConnections.size,
      unique_devices: uniqueCount,
      system_resource: {
        heap_used: toMB(mem.heapUsed),
        rss: toMB(mem.rss),
        uptime: Math.floor(process.uptime()) + 's',
      },
    };
  }

  return new Promise((resolve) => {
    pm2.connect((err) => {
      if (err) return resolve({ status: 'error', message: 'PM2 Connect Error' });

      pm2.list((listErr, processList) => {
        pm2.disconnect();
        if (listErr) return resolve({ status: 'error', message: 'PM2 List Error' });

        try {
          const instances = processList.filter((proc) => proc.name === CONFIG.PROCESS_NAME).map(getInstanceMetrics);

          // 聚合所有实例的数据
          const totalConns = instances.reduce((sum, i) => sum + i.connections, 0);
          const totalDevices = instances.reduce((sum, i) => sum + i.unique_devices, 0);

          resolve({
            status: 'success',
            mode: `生产环境 (${instances.length} 实例集群)`,
            summary: {
              total_active_connections: totalConns,
              total_unique_devices: totalDevices,
              server_time: new Date().toISOString(),
            },
            instances,
          });
        } catch (error) {
          resolve({ status: 'error', message: 'Data Processing Error' });
        }
      });
    });
  });
});

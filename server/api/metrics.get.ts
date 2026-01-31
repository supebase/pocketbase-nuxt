import io from '@pm2/io';
import pm2 from 'pm2';
import type { ProcessDescription } from 'pm2';

interface ConnectionInfo {
  id: string;
  connectedAt: number;
  lastHeartbeat: number;
}

const CONFIG = {
  PROCESS_NAME: process.env.PM2_PROCESS_NAME || 'Eric', // 和 PM2 名称一致
  HEARTBEAT_TIMEOUT: 30000, // 30秒
  CLEANUP_INTERVAL: 60000, // 60秒
};

const activeConnections = new Map<string, ConnectionInfo>();

const connGauge = io.metric({
  name: 'Active Connections',
});

export const addConnection = (id: string): void => {
  const now = Date.now();
  activeConnections.set(id, {
    id,
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

const cleanupStaleConnections = (): void => {
  const now = Date.now();
  let cleaned = 0;

  for (const [id, conn] of activeConnections.entries()) {
    if (now - conn.lastHeartbeat > CONFIG.HEARTBEAT_TIMEOUT) {
      activeConnections.delete(id);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[Metrics] Cleaned ${cleaned} stale connections`);
    updateGauge();
  }
};

const updateGauge = (): void => {
  connGauge.set(activeConnections.size);
};

setInterval(cleanupStaleConnections, CONFIG.CLEANUP_INTERVAL);

const toMB = (bytes: number): string => {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
};

const getInstanceMetrics = (proc: ProcessDescription) => {
  const env = proc.pm2_env as any; // PM2 类型定义不完整，这里需要 any
  const axmMonitor = env?.axm_monitor || {};

  return {
    pm_id: proc.pm_id ?? 'N/A',
    status: env?.status ?? 'unknown',
    connections: axmMonitor['Active Connections']?.value ?? 0,
    cpu: (proc.monit?.cpu ?? 0) + '%',
    memory: toMB(proc.monit?.memory ?? 0),
    restart_count: env?.restart_time ?? 0,
  };
};

export default defineEventHandler(async (event) => {
  const isPM2 = process.env.PM2_HOME !== undefined;

  if (!isPM2) {
    const mem = process.memoryUsage();
    return {
      status: 'success',
      mode: '单机模式',
      total_connections: activeConnections.size,
      system_resource: {
        heap_used: toMB(mem.heapUsed),
        rss: toMB(mem.rss),
        uptime: Math.floor(process.uptime()) + 's',
      },
    };
  }

  return new Promise((resolve) => {
    pm2.connect((err) => {
      if (err) {
        return resolve({
          status: 'error',
          message: 'PM2 连接失败: ' + err.message,
        });
      }

      pm2.list((listErr, processList) => {
        pm2.disconnect();

        if (listErr) {
          return resolve({
            status: 'error',
            message: 'PM2 获取进程列表失败: ' + listErr.message,
          });
        }

        try {
          const instances = processList.filter((proc) => proc.name === CONFIG.PROCESS_NAME).map(getInstanceMetrics);

          const totalConns = instances.reduce((sum, i) => sum + Number(i.connections || 0), 0);

          const result = {
            status: 'success',
            mode: `集群模式 (${instances.length} 实例)`,
            summary: {
              total_active_connections: totalConns,
              server_time: new Date().toISOString(),
            },
            instances,
          };

          const query = getQuery(event);
          if (query.pretty !== undefined) {
            event.node.res.setHeader('Content-Type', 'application/json; charset=utf-8');
            event.node.res.end(JSON.stringify(result, null, 2));
            return;
          }

          resolve(result);
        } catch (error) {
          resolve({
            status: 'error',
            message: '处理数据时出错: ' + (error as Error).message,
          });
        }
      });
    });
  });
});

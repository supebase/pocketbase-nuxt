import pm2 from 'pm2';
import type { ProcessDescription } from 'pm2';

const CONFIG = {
  // 确保这与你 PM2 运行时的进程名一致
  PROCESS_NAME: process.env.PM2_PROCESS_NAME || 'Eric',
};

const toMB = (bytes: number): string => (bytes / 1024 / 1024).toFixed(2) + ' MB';

const getInstanceMetrics = (proc: ProcessDescription) => {
  const env = proc.pm2_env as any;
  return {
    pm_id: proc.pm_id ?? 'N/A',
    status: env?.status ?? 'unknown',
    cpu: (proc.monit?.cpu ?? 0) + '%',
    memory: toMB(proc.monit?.memory ?? 0),
    restart_count: env?.restart_time ?? 0,
    uptime: Math.floor((Date.now() - (env?.pm_uptime || Date.now())) / 1000) + 's',
  };
};

export default defineEventHandler(async (event) => {
  const isPM2 = process.env.PM2_HOME !== undefined;

  // 开发环境：直接返回当前进程资源
  if (!isPM2) {
    const mem = process.memoryUsage();
    return {
      status: 'success',
      mode: '开发环境',
      system_resource: {
        heap_used: toMB(mem.heapUsed),
        rss: toMB(mem.rss),
        uptime: Math.floor(process.uptime()) + 's',
      },
    };
  }

  // 生产环境：连接 PM2 提取集群指标
  return new Promise((resolve) => {
    pm2.connect((err) => {
      if (err) return resolve({ status: 'error', message: 'PM2 Connect Error' });

      pm2.list((listErr, processList) => {
        pm2.disconnect();
        if (listErr) return resolve({ status: 'error', message: 'PM2 List Error' });

        try {
          const instances = processList.filter((proc) => proc.name === CONFIG.PROCESS_NAME).map(getInstanceMetrics);

          resolve({
            status: 'success',
            mode: `集群模式 (${instances.length} 实例)`,
            summary: {
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

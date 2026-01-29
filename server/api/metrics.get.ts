import io from '@pm2/io';
import pm2 from 'pm2';

// 1. 修复：@pm2/io 的 io.metric 接受的配置项
// 如果 TS 报错 'type'，可以直接传值，因为 runtime 是支持的，或者通过类型断言绕过
const connGauge = (io as any).metric({
  name: 'Active Connections',
  // 注意：某些版本 io.metric 不需要显式传 type: 'gauge'，它是默认行为
});

let localCount = 0;

export const updateConnCount = (diff: number) => {
  localCount += diff;
  connGauge.set(localCount);
};

export default defineEventHandler(async (event) => {
  const isPM2 = process.env.PM2_HOME !== undefined;
  const toMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + ' MB';

  if (!isPM2) {
    const mem = process.memoryUsage();
    return {
      status: 'success',
      mode: '单机模式 (本地)',
      total_connections: localCount,
      system_resource: {
        heap_used: toMB(mem.heapUsed),
        rss: toMB(mem.rss),
        uptime: Math.floor(process.uptime()) + 's',
      },
    };
  }

  return new Promise((resolve) => {
    pm2.connect((err) => {
      if (err) return resolve({ status: 'error', message: 'PM2 connect failed' });

      pm2.list((err, list) => {
        pm2.disconnect();
        if (err) return resolve({ status: 'error', message: 'PM2 list failed' });

        // 2. 修复：通过类型断言访问 axm_monitor
        const instances = list
          .filter((proc) => proc.name === 'Eric')
          .map((proc) => {
            const env = proc.pm2_env as any; // 转为 any 以访问动态属性
            const axm_monitor = env?.axm_monitor;

            return {
              pm_id: proc.pm_id,
              status: env?.status,
              // 关键修复：从自定义指标中取值
              connections: axm_monitor?.['Active Connections']?.value ?? 0,
              cpu: proc.monit?.cpu + '%',
              memory: toMB(proc.monit?.memory || 0),
              restart_count: env?.restart_time,
            };
          });

        const totalConns = instances.reduce((sum, i) => sum + Number(i.connections), 0);

        // 获取 ?pretty 参数支持友好查看
        const query = getQuery(event);
        const result = {
          status: 'success',
          mode: `集群模式 (${instances.length} 个实例)`,
          summary: {
            total_active_connections: totalConns,
            server_time: new Date().toLocaleString(),
          },
          instances,
        };

        if (query.pretty !== undefined) {
          // 在 Nuxt 中手动处理美化输出
          event.node.res.setHeader('Content-Type', 'application/json; charset=utf-8');
          event.node.res.end(JSON.stringify(result, null, 2));
          return;
        }

        resolve(result);
      });
    });
  });
});

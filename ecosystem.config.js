// @ts-check

/**
 * PM2 Ecosystem Configuration for Nitro/Nuxt
 * @see https://pm2.keymetrics.io/docs/usage/application-declaration/
 * * @type {{ apps: import('pm2').StartOptions[] }}
 */
const config = {
  apps: [
    {
      name: 'Eric',
      script: './.output/server/index.mjs',
      exec_mode: 'cluster', // 开启集群模式
      instances: 2, // 根据 CPU 核心数自动创建实例

      // 环境变量配置
      env: {
        // @ts-ignore
        NITRO_PORT: 24000,
        NITRO_HOST: '0.0.0.0',
        NODE_ENV: 'production',
      },

      // 进阶优化建议：
      max_memory_restart: '2G', // 单个实例超过内存限制自动重启
      autorestart: true, // 异常退出自动重启
      watch: false, // 生产环境务必设置为 false
    },
  ],
};

module.exports = config;

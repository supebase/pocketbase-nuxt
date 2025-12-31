export default defineNitroPlugin((nitroApp) => {
  // 定义触发任务的辅助函数
  const runCleanupTask = async () => {
    // 检查是否在开发环境下，避免过于频繁的自动清理干扰开发工作
    // 或者通过环境变量控制开关
    if (process.env.DISABLE_SCHEDULER === 'true') return;

    console.log(
      `[Scheduler] [${new Date().toLocaleString()}] 正在触发自动清理任务: cleanup:assets`
    );
    try {
      // 这里的 runTask 是 Nitro 提供的全局方法
      const result = await runTask('cleanup:assets', {
        payload: { triggeredBy: 'scheduler' },
      });
      console.log('[Scheduler] 任务执行完成:', result);
    } catch (e) {
      console.error('[Scheduler] 任务触发失败:', e);
    }
  };

  // 1. 延迟启动：服务器启动 1 分钟后执行
  const initialDelay = 60 * 1000;
  const initialTimer = setTimeout(runCleanupTask, initialDelay);

  // 2. 定时循环：每 24 小时执行一次
  const intervalTime = 24 * 60 * 60 * 1000;
  const intervalTimer = setInterval(runCleanupTask, intervalTime);

  // 3. 关键补丁：当 Nitro 钩子关闭时，清理定时器防止内存泄漏（虽然插件生命周期通常随进程结束，但这是好习惯）
  nitroApp.hooks.hook('close', () => {
    clearTimeout(initialTimer);
    clearInterval(intervalTimer);
  });
});

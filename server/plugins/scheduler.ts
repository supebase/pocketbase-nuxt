export default defineNitroPlugin((nitroApp) => {
  // 定义触发任务的辅助函数
  const runCleanupTask = async () => {
    console.log('[Scheduler] 正在触发自动清理任务: cleanup:assets');
    try {
      // 通过内置的任务运行函数直接调用
      // 注意：'cleanup:assets' 必须对应 server/tasks/cleanup/assets.ts
      await runTask('cleanup:assets', { payload: { triggeredBy: 'setInterval' } });
      console.log('[Scheduler] 清理任务指令已成功下达');
    } catch (e) {
      console.error('[Scheduler] 任务触发失败，请检查任务文件是否存在:', e);
    }
  };

  // 1. 服务器启动后延迟一分钟执行第一次清理 (避免占用启动资源)
  setTimeout(() => {
    runCleanupTask();
  }, 60 * 1000);

  // 2. 开启每 24 小时一次的循环
  setInterval(
    () => {
      runCleanupTask();
    },
    24 * 60 * 60 * 1000
  );
});

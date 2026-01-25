/**
 * @file Real-time SSE Handler
 * @description 提供 Server-Sent Events 流式推送，监听 PocketBase 数据库变动并同步至前端。
 */
export default defineEventHandler(async (event) => {
  // 1. 设置响应头
  setHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const query = getQuery(event);
  const collections =
    typeof query.cols === 'string'
      ? query.cols
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean)
      : ['posts'];

  const eventStream = createEventStream(event);
  // getPocketBase 内部现在建议已实现请求内缓存
  const pb = getPocketBase(event);

  // 2. 预检：如果用户未通过中间件身份验证，且订阅的是私有集合，可以直接在这里拦截
  // 避免开启不必要的 PB 订阅连接

  // 3. 订阅逻辑优化
  const activeSubscriptions = new Set<string>();

  for (const col of collections) {
    try {
      await pb.collection(col).subscribe(
        '*',
        (data: { action: any; record: any }) => {
          // 检查流是否已关闭，避免向已销毁的流推数据
          if (!event.node.req.destroyed) {
            eventStream.push({
              event: col,
              data: JSON.stringify({ action: data.action, record: data.record }),
            });
          }
        },
        { expand: 'user' },
      );
      activeSubscriptions.add(col);
    } catch (err) {
      // console.error(`[SSE 订阅失败] ${col}:`, err);
    }
  }

  eventStream.push({ event: 'connected', data: new Date().toISOString() });

  // 4. 心跳机制：频率调整至 30s (根据前文建议)
  const timer = setInterval(() => {
    if (event.node.req.destroyed) {
      cleanup();
      return;
    }
    eventStream.push({ event: 'ping', data: 'heartbeat' });
  }, 30000);

  /**
   * 资源清理
   */
  let isCleaned = false;
  const cleanup = async () => {
    if (isCleaned) return;
    isCleaned = true;

    clearInterval(timer);

    // 先关闭流，让客户端感知断开
    try {
      await eventStream.close();
    } catch (e) {}

    // 重点：如果 PB 实例存在且有订阅，执行取消订阅
    // 使用 activeSubscriptions 确保只取消成功开启的订阅
    if (activeSubscriptions.size > 0) {
      const cleanupTasks = Array.from(activeSubscriptions).map((col) =>
        pb
          .collection(col)
          .unsubscribe('*')
          .catch(() => {}),
      );

      await Promise.race([
        Promise.all(cleanupTasks),
        new Promise((resolve) => setTimeout(resolve, 2000)), // 缩短至 2s
      ]);
    }
  };

  // 5. 事件绑定
  event.node.req.on('close', cleanup);
  eventStream.onClosed(cleanup);

  return eventStream.send();
});

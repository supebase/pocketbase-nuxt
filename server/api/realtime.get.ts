export default defineEventHandler(async (event) => {
  // 强制设置响应头，禁用一切缓存
  setHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const query = getQuery(event);
  const collections = typeof query.cols === 'string' ? query.cols.split(',') : ['posts'];
  const eventStream = createEventStream(event);

  const pb = getPocketBaseInstance(event);

  for (const col of collections) {
    try {
      // 注意：不要在 subscribe 内部使用 await
      pb.collection(col).subscribe(
        '*',
        (data) => {
          eventStream.push({
            event: col,
            data: JSON.stringify({
              action: data.action,
              record: data.record,
            }),
          });
        },
        { expand: 'user' }
      );
    } catch (err) {
      console.error(`订阅失败: ${col}`, err);
    }
  }

  // 每 15 秒发送心跳，确保连接不被踢掉
  const timer = setInterval(() => {
    eventStream.push({ event: 'ping', data: 'heartbeat' });
  }, 15000);

  eventStream.onClosed(async () => {
    clearInterval(timer);
    // 使用同一个 pb 实例取消订阅
    for (const col of collections) {
      await pb
        .collection(col)
        .unsubscribe('*')
        .catch(() => {});
    }
  });

  return eventStream.send();
});

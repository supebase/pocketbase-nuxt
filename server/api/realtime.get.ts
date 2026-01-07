import { getPocketBase } from '../utils/pocketbase';

export default defineEventHandler(async (event) => {
  // 1. 设置 SSE 标准响应头
  setHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // 禁用 Nginx 缓存
  });

  const query = getQuery(event);
  const collections =
    typeof query.cols === 'string'
      ? query.cols
          .split(',')
          .map((col) => col.trim())
          .filter(Boolean)
      : ['posts'];

  // 2. 创建事件流与独立的 PB 实例
  const eventStream = createEventStream(event);
  const pb = getPocketBase(event);

  // 3. 执行订阅逻辑
  for (const col of collections) {
    try {
      await pb.collection(col).subscribe(
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
        { expand: 'user' },
      );
    } catch (err) {
      console.error(`[SSE] 订阅集合失败: ${col}`, err);
    }
  }

  // 4. 心跳检测 (Keep-alive)
  const timer = setInterval(() => {
    eventStream.push({ event: 'ping', data: Date.now().toString() });
  }, 20000);

  /**
   * 核心修复：定义统一清理函数
   * 确保释放定时器、取消所有 PB 订阅并销毁实例
   */
  const cleanup = async () => {
    clearInterval(timer);

    try {
      // 并行取消所有订阅，防止循环等待
      await Promise.all(
        collections.map((col) =>
          pb
            .collection(col)
            .unsubscribe('*')
            .catch(() => {}),
        ),
      );
      console.log(`[SSE] 成功清理 ${collections.length} 个集合的订阅`);
    } catch (e) {
      console.error('[SSE] 清理资源异常', e);
    }
  };

  // 5. 多重保障的清理逻辑
  // 监听底层 Node.js HTTP 请求关闭（最可靠的异常断开监听）
  event.node.req.on('close', cleanup);
  // 监听 Nuxt 事件流关闭
  eventStream.onClosed(cleanup);

  return eventStream.send();
});

/**
 * @file Real-time SSE Handler
 * @description 提供 Server-Sent Events 流式推送，监听 PocketBase 数据库变动并同步至前端。
 */
import { addConnection, removeConnection, updateHeartbeat } from './metrics.get';
import { randomUUID } from 'crypto';

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

  // ===== 修复：生成唯一连接 ID =====
  const connectionId = randomUUID();
  addConnection(connectionId);

  const eventStream = createEventStream(event);
  const pb = getPocketBase(event);

  // 订阅逻辑
  const activeSubscriptions = new Set<string>();

  for (const col of collections) {
    try {
      await pb.collection(col).subscribe(
        '*',
        (data: { action: any; record: any }) => {
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
      console.error(`[SSE 订阅失败] ${col}:`, err);
    }
  }

  eventStream.push({ event: 'connected', data: new Date().toISOString() });

  // ===== 修复：心跳机制同时更新连接状态 =====
  const timer = setInterval(() => {
    if (event.node.req.destroyed) {
      cleanup();
      return;
    }
    updateHeartbeat(connectionId); // 更新心跳时间
    eventStream.push({ event: 'ping', data: 'heartbeat' });
  }, 30000);

  // ===== 修复：清理时移除连接 =====
  let isCleaned = false;
  const cleanup = async () => {
    if (isCleaned) return;
    isCleaned = true;

    clearInterval(timer);
    removeConnection(connectionId);

    try {
      await eventStream.close();
    } catch (e) {}

    if (activeSubscriptions.size > 0) {
      const cleanupTasks = Array.from(activeSubscriptions).map((col) =>
        pb
          .collection(col)
          .unsubscribe('*')
          .catch(() => {}),
      );

      await Promise.race([Promise.all(cleanupTasks), new Promise((resolve) => setTimeout(resolve, 2000))]);
    }
  };

  event.node.req.on('close', cleanup);
  eventStream.onClosed(cleanup);

  return eventStream.send();
});

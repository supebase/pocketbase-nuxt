/**
 * @file Real-time SSE Handler
 * @description 提供 Server-Sent Events 流式推送，监听 PocketBase 数据库变动并同步至前端。
 */

import { getPocketBase } from '../utils/pocketbase';

export default defineEventHandler(async (event) => {
  // 设置 SSE 标准响应头：确保流式传输不被缓存或缓冲
  setHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // 禁用 Nginx 缓冲，确保数据即时到达
  });

  // 解析待订阅的集合列表 (默认为 posts)
  const query = getQuery(event);
  const collections =
    typeof query.cols === 'string'
      ? query.cols
          .split(',')
          .map((col) => col.trim())
          .filter(Boolean)
      : ['posts'];

  // 初始化流与独立的 PB 实例 (确保请求间状态隔离)
  const eventStream = createEventStream(event);
  const pb = getPocketBase(event);

  // 订阅逻辑：动态监听多个集合的实时变动
  for (const col of collections) {
    try {
      // 将 PB 的变更推送至 SSE 事件流
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
      console.error(`[SSE 错误] 集合订阅失败 ${col}`, err);
    }
  }

  // 心跳机制：每 20 秒发送一次注释行，防止连接因闲置被网关断开
  const timer = setInterval(() => {
    if (!event.node.req.destroyed) {
      eventStream.push({
        event: 'ping',
        data: 'heartbeat',
      });
    }
  }, 20000);

  /**
   * 资源清理锁：防止重复执行清理逻辑
   */
  let isCleaned = false;

  // 在 cleanup 中增加超时保护，防止资源释放卡死线程
  const cleanup = async () => {
    if (isCleaned) return;
    isCleaned = true;

    clearInterval(timer);
    eventStream.close();

    // 使用 Promise.race 设定清理上限，防止 PB 取消订阅动作卡住服务器
    const cleanupTasks = Promise.all(
      collections.map((col) =>
        pb
          .collection(col)
          .unsubscribe('*')
          .catch(() => {}),
      ),
    );

    await Promise.race([
      cleanupTasks,
      new Promise((resolve) => setTimeout(resolve, 3000)), // 3秒强制结束
    ]);

    console.log(`[SSE 关闭] 资源已安全释放`);
  };

  // 生命周期监听：捕获客户端断开（如刷新、关闭页面）
  event.node.req.on('close', cleanup);
  eventStream.onClosed(cleanup);

  return eventStream.send();
});

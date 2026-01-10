import { getPocketBase } from '../utils/pocketbase';

export default defineEventHandler(async (event) => {
  // 1. 设置 SSE 标准响应头
  setHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // 关键：禁用 Nginx 缓冲
  });

  const query = getQuery(event);
  const collections =
    typeof query.cols === 'string'
      ? query.cols
          .split(',')
          .map((col) => col.trim())
          .filter(Boolean)
      : ['posts'];

  // 2. 初始化流和独立的 PB 实例
  const eventStream = createEventStream(event);
  const pb = getPocketBase(event);

  // 3. 订阅逻辑
  for (const col of collections) {
    try {
      // 建议使用具体的回调函数以方便取消订阅
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
      console.error(`[SSE] 订阅集合 ${col} 失败:`, err);
    }
  }

  // 4. 心跳检测 (每 20 秒发送一次)
  const timer = setInterval(() => {
    if (!event.node.req.destroyed) {
      // 发送注释行作为心跳，不会被前端 JSON.parse 干扰
      eventStream.push(': heartbeat\n\n');
    }
  }, 20000);

  /**
   * 核心修复：清理锁机制
   * 确保释放定时器、取消所有订阅且不重复执行
   */
  let isCleaned = false;

  const cleanup = async () => {
    if (isCleaned) return;
    isCleaned = true;

    clearInterval(timer);
    // 强制关闭事件流，通知客户端
    eventStream.close();
    console.log(`[SSE] 正在清理连接: ${collections.join(', ')}`);

    try {
      // 遍历取消订阅，确保释放 PocketBase 服务器资源
      await Promise.all(
        collections.map((col) =>
          pb
            .collection(col)
            .unsubscribe('*')
            .catch(() => {}),
        ),
      );
      // 如果 getPocketBase 是为每个请求新建的，可以在此处销毁引用
    } catch (e) {
      console.error('[SSE] 清理资源异常:', e);
    } finally {
      await eventStream.close();
    }
  };

  // 5. 监听断开事件
  // node.req.on('close') 是捕捉客户端（如刷新页面）断开最可靠的方式
  event.node.req.on('close', cleanup);
  // eventStream.onClosed 作为第二重保障
  eventStream.onClosed(cleanup);

  return eventStream.send();
});

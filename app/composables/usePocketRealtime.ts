/**
 * 状态定义：
 * 1. 使用 useState 确保状态在 SSR 序列化时是安全的。
 * 2. 物理连接实例和心跳管理放在客户端单例对象中，实现全局连接复用。
 */

interface RealtimePayload {
  collection: string;
  action: string;
  record: any;
}

// 客户端特有的单例管理容器
const sseManager = {
  instance: null as EventSource | null,
  subscribers: new Set<(payload: RealtimePayload) => void>(),
  retryCount: 0,
  retryTimer: null as any,
  // 新增：心跳检查定时器和最后通信时间戳
  heartbeatTimer: null as any,
  lastActivity: Date.now(),
  cleanupTimer: null as any,
};

export const usePocketRealtime = () => {
  const status = useState<'connecting' | 'online' | 'offline'>('pocket-sse-status', () => 'offline');
  let currentCallback: ((payload: RealtimePayload) => void) | null = null;

  /**
   * 建立物理连接
   */
  const connectPhysical = () => {
    if (import.meta.server) return;

    // 清除可能存在的静默关闭定时器
    if (sseManager.cleanupTimer) {
      clearTimeout(sseManager.cleanupTimer);
      sseManager.cleanupTimer = null;
    }

    if (status.value === 'connecting') return;
    if (sseManager.instance && sseManager.instance.readyState === 1) {
      status.value = 'online';
      return;
    }

    status.value = 'connecting';
    const allCollections = ['posts', 'comments', 'likes'];
    const colsParam = encodeURIComponent(allCollections.join(','));

    const es = new EventSource(`/api/realtime?cols=${colsParam}`, {
      withCredentials: true,
    });

    // 新增：心跳检测启动逻辑
    const startHeartbeat = () => {
      clearInterval(sseManager.heartbeatTimer);
      sseManager.lastActivity = Date.now();
      sseManager.heartbeatTimer = setInterval(() => {
        const threshold = 45000; // 45秒无响应认为掉线
        if (Date.now() - sseManager.lastActivity > threshold) {
          console.warn('[SSE] 检测到僵尸连接，准备重连...');
          reconnect();
        }
      }, 10000); // 每10秒检查一次
    };

    const reconnect = () => {
      es.close();
      sseManager.instance = null;
      status.value = 'offline';

      const delay = Math.min(1000 * Math.pow(2, sseManager.retryCount), 30000);
      clearTimeout(sseManager.retryTimer);
      sseManager.retryTimer = setTimeout(() => {
        sseManager.retryCount++;
        connectPhysical();
      }, delay);
    };

    es.onopen = () => {
      status.value = 'online';
      sseManager.retryCount = 0;
      startHeartbeat(); // 开启心跳
      console.log('[SSE] 全局物理连接已建立');
    };

    // 新增：监听通用 message 事件更新活跃时间戳
    es.onmessage = () => {
      sseManager.lastActivity = Date.now();
    };

    allCollections.forEach((col) => {
      es.addEventListener(col, (event: MessageEvent) => {
        sseManager.lastActivity = Date.now(); // 业务事件也算活跃
        try {
          const data = JSON.parse(event.data);
          const payload: RealtimePayload = {
            collection: col,
            action: data.action,
            record: data.record,
          };
          sseManager.subscribers.forEach((cb) => cb(payload));
        } catch (e) {
          console.error(`[SSE] 解析数据失败 (${col}):`, e);
        }
      });
    });

    es.onerror = () => {
      clearInterval(sseManager.heartbeatTimer);
      reconnect();
    };

    sseManager.instance = es;
  };

  /**
   * 监听消息
   */
  const listen = (callback: (payload: RealtimePayload) => void) => {
    if (import.meta.server) return;
    if (sseManager.subscribers.has(callback)) return;

    currentCallback = callback;
    sseManager.subscribers.add(callback);
    connectPhysical();
  };

  /**
   * 释放资源
   */
  const close = () => {
    if (currentCallback) {
      sseManager.subscribers.delete(currentCallback);
      currentCallback = null;
    }

    // 优化：引用计数自动关闭逻辑
    // 使用延迟关闭 (Graceful Shutdown) 避免路由切换时的瞬时重连
    if (sseManager.subscribers.size === 0 && sseManager.instance) {
      clearTimeout(sseManager.cleanupTimer);
      sseManager.cleanupTimer = setTimeout(() => {
        if (sseManager.subscribers.size === 0 && sseManager.instance) {
          console.log('[SSE] 无活跃订阅者，自动断开连接以节省资源');
          sseManager.instance.close();
          sseManager.instance = null;
          clearInterval(sseManager.heartbeatTimer);
          status.value = 'offline';
        }
      }, 5000); // 5秒缓冲时间
    }
  };

  onUnmounted(() => {
    close();
  });

  return {
    listen,
    status: readonly(status),
    close,
  };
};

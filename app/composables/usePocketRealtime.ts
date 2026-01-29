import type { RealtimePayload } from '~/types';

/**
 * 全局 SSE 管理器（单例）
 * 确保在整个应用生命周期内，所有组件共享同一个物理连接
 */
const sseManager = {
  instance: null as EventSource | null,
  subscribers: new Set<(payload: RealtimePayload) => void>(),
  isConnecting: false,
  retryCount: 0,
  retryTimer: null as any,
  heartbeatTimer: null as any,
  lastActivity: Date.now(),
  cleanupTimer: null as any,
};

export const usePocketRealtime = () => {
  const status = useState<'connecting' | 'online' | 'offline'>('pocket-sse-status', () => 'offline');

  // 跟踪当前组件实例注册的所有回调，用于自动清理
  const localSubscribers = new Set<(payload: RealtimePayload) => void>();

  /**
   * 彻底断开物理连接并清理所有定时器
   */
  const destroyConnection = () => {
    // console.log('[SSE] 切断物理连接');
    if (sseManager.instance) {
      sseManager.instance.close();
      sseManager.instance = null;
    }
    sseManager.isConnecting = false;
    clearInterval(sseManager.heartbeatTimer);
    clearTimeout(sseManager.retryTimer);
    status.value = 'offline';
  };

  /**
   * 建立物理连接逻辑
   */
  const connectPhysical = () => {
    if (import.meta.server) return;

    // 如果有待执行的自动断开任务，立即取消
    if (sseManager.cleanupTimer) {
      clearTimeout(sseManager.cleanupTimer);
      sseManager.cleanupTimer = null;
    }

    // 检查现有连接状态
    if (sseManager.instance) {
      if (sseManager.instance.readyState === 1) {
        status.value = 'online';
        return;
      }
      if (sseManager.instance.readyState === 0) {
        status.value = 'connecting';
        return;
      }
    }

    if (sseManager.isConnecting) return;
    sseManager.isConnecting = true;
    status.value = 'connecting';

    // console.log('[SSE] 初始化连接...');

    const allCollections = ['posts', 'comments', 'likes', 'notifications'];
    const colsParam = encodeURIComponent(allCollections.join(','));

    const es = new EventSource(`/api/realtime?cols=${colsParam}&t=${Date.now()}`, {
      withCredentials: true,
    });

    const reconnect = () => {
      destroyConnection();
      const delay = Math.min(1000 * Math.pow(2, sseManager.retryCount), 30000) + Math.random() * 1000;
      // console.log(`[SSE] 将在 ${Math.round(delay)}ms 后重新连接...`);

      sseManager.retryTimer = setTimeout(() => {
        sseManager.retryCount++;
        connectPhysical();
      }, delay);
    };

    const updateActivity = () => {
      sseManager.lastActivity = Date.now();
    };

    const startHeartbeat = () => {
      clearInterval(sseManager.heartbeatTimer);
      updateActivity();
      sseManager.heartbeatTimer = setInterval(() => {
        const threshold = 60000;
        if (Date.now() - sseManager.lastActivity > threshold) {
          // console.warn('[SSE] 心跳丢失，正在重新连接...');
          reconnect();
        }
      }, 30000);
    };

    es.onopen = () => {
      // console.log('[SSE] 在线');
      sseManager.isConnecting = false;
      sseManager.retryCount = 0;
      status.value = 'online';
      startHeartbeat();
    };

    es.onmessage = updateActivity;
    es.addEventListener('ping', updateActivity);
    es.addEventListener('connected', updateActivity);

    allCollections.forEach((col) => {
      es.addEventListener(col, (event: MessageEvent) => {
        updateActivity();
        try {
          const data = JSON.parse(event.data);
          const payload: RealtimePayload = {
            collection: col,
            action: data.action,
            record: data.record,
          };
          // 广播给所有全局订阅者
          sseManager.subscribers.forEach((cb) => cb(payload));
        } catch (e) {
          /* Parse error */
        }
      });
    });

    es.onerror = () => {
      sseManager.isConnecting = false;
      reconnect();
    };

    sseManager.instance = es;
  };

  // 全局一次性初始化：浏览器事件监听
  if (import.meta.client && !(window as any).SSE_GLOBAL_INIT) {
    (window as any).SSE_GLOBAL_INIT = true;
    window.addEventListener('beforeunload', () => destroyConnection());
    window.addEventListener('online', () => {
      // console.log('[SSE] 网络已恢复');
      destroyConnection();
      connectPhysical();
    });
  }

  /**
   * 公开 API：监听实时数据
   */
  const listen = (callback: (payload: RealtimePayload) => void) => {
    if (import.meta.server) return;

    if (!sseManager.subscribers.has(callback)) {
      sseManager.subscribers.add(callback);
      localSubscribers.add(callback); // 记录到当前组件实例
      connectPhysical();
    }
  };

  /**
   * 公开 API：停止监听
   * @param callback 可选。如果不传，则清理当前组件注册的所有监听。
   */
  const close = (callback?: (payload: RealtimePayload) => void) => {
    if (callback) {
      sseManager.subscribers.delete(callback);
      localSubscribers.delete(callback);
    } else {
      // 如果没传特定 callback，清理当前组件的所有订阅
      localSubscribers.forEach((cb) => sseManager.subscribers.delete(cb));
      localSubscribers.clear();
    }

    // 检查全局：如果已经没有任何订阅者，延迟关闭物理连接
    if (sseManager.subscribers.size === 0 && sseManager.instance) {
      clearTimeout(sseManager.cleanupTimer);
      sseManager.cleanupTimer = setTimeout(() => {
        if (sseManager.subscribers.size === 0) {
          destroyConnection();
        }
      }, 2000);
    }
  };

  // 组件卸载时自动清理
  onUnmounted(() => close());

  return {
    listen,
    status: readonly(status),
    close,
  };
};

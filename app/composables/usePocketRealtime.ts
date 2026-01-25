import type { RealtimePayload } from '~/types';

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
  let currentCallback: ((payload: RealtimePayload) => void) | null = null;

  const destroyConnection = () => {
    console.log('[SSE] Destroying connection and clearing timers');
    if (sseManager.instance) {
      sseManager.instance.close();
      sseManager.instance = null;
    }
    sseManager.isConnecting = false;
    clearInterval(sseManager.heartbeatTimer);
    clearTimeout(sseManager.retryTimer);
    status.value = 'offline';
  };

  const connectPhysical = () => {
    if (import.meta.server) return;

    if (sseManager.cleanupTimer) {
      clearTimeout(sseManager.cleanupTimer);
      sseManager.cleanupTimer = null;
    }

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

    console.log('[SSE] Attempting new connection');

    const allCollections = ['posts', 'comments', 'likes'];
    const colsParam = encodeURIComponent(allCollections.join(','));

    const es = new EventSource(`/api/realtime?cols=${colsParam}&t=${Date.now()}`, {
      withCredentials: true,
    });

    const reconnect = () => {
      destroyConnection();
      const delay = Math.min(1000 * Math.pow(2, sseManager.retryCount), 30000) + Math.random() * 1000;
      console.log(`[SSE] Reconnecting in ${Math.round(delay)}ms...`);

      sseManager.retryTimer = setTimeout(() => {
        sseManager.retryCount++;
        connectPhysical();
      }, delay);
    };

    const startHeartbeat = () => {
      clearInterval(sseManager.heartbeatTimer);
      sseManager.lastActivity = Date.now();
      sseManager.heartbeatTimer = setInterval(() => {
        const threshold = 60000;
        if (Date.now() - sseManager.lastActivity > threshold) {
          console.warn('[SSE] Heartbeat timeout, restarting...');
          reconnect();
        }
      }, 30000);
    };

    // --- 新增：统一的活跃状态更新函数 ---
    const updateActivity = () => {
      sseManager.lastActivity = Date.now();
    };

    es.onopen = () => {
      console.log('[SSE] Connection established');
      sseManager.isConnecting = false;
      sseManager.retryCount = 0;
      status.value = 'online';
      startHeartbeat();
    };

    // 监听默认消息 (没有指定 event 字段的消息)
    es.onmessage = updateActivity;

    // --- 修改点：增加对系统事件的监听以维持心跳 ---
    // 监听后端推送的 event: 'ping'
    es.addEventListener('ping', updateActivity);
    // 监听后端推送的 event: 'connected'
    es.addEventListener('connected', updateActivity);

    // 为每个业务集合绑定监听器
    allCollections.forEach((col) => {
      es.addEventListener(col, (event: MessageEvent) => {
        // 收到任何业务数据，自然也代表连接是活跃的
        updateActivity();
        try {
          const data = JSON.parse(event.data);
          const payload: RealtimePayload = {
            collection: col,
            action: data.action,
            record: data.record,
          };
          sseManager.subscribers.forEach((cb) => cb(payload));
        } catch (e) {
          console.error('[SSE] Parse error', e);
        }
      });
    });

    es.onerror = () => {
      sseManager.isConnecting = false;
      // 注意：EventSource 出错时会自动重连，但我们有自定义的退避机制，所以调用 reconnect
      reconnect();
    };

    sseManager.instance = es;
  };

  if (import.meta.client && !(window as any).SSE_GLOBAL_INIT) {
    (window as any).SSE_GLOBAL_INIT = true;
    window.addEventListener('beforeunload', () => destroyConnection());
    window.addEventListener('online', () => {
      console.log('[SSE] Network back online, refreshing connection');
      destroyConnection();
      connectPhysical();
    });
  }

  const listen = (callback: (payload: RealtimePayload) => void) => {
    if (import.meta.server) return;
    if (sseManager.subscribers.has(callback)) return;
    currentCallback = callback;
    sseManager.subscribers.add(callback);
    connectPhysical();
  };

  const close = () => {
    if (currentCallback) {
      sseManager.subscribers.delete(currentCallback);
      currentCallback = null;
    }
    if (sseManager.subscribers.size === 0 && sseManager.instance) {
      clearTimeout(sseManager.cleanupTimer);
      sseManager.cleanupTimer = setTimeout(() => {
        if (sseManager.subscribers.size === 0) {
          destroyConnection();
        }
      }, 2000);
    }
  };

  onUnmounted(() => close());

  return {
    listen,
    status: readonly(status),
    close,
  };
};

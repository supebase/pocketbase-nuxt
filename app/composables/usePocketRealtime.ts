interface RealtimePayload {
  collection: string;
  action: string;
  record: any;
}

const sseManager = {
  instance: null as EventSource | null,
  subscribers: new Set<(payload: RealtimePayload) => void>(),
  retryCount: 0,
  retryTimer: null as any,
  heartbeatTimer: null as any,
  lastActivity: Date.now(),
  cleanupTimer: null as any,
};

export const usePocketRealtime = () => {
  const status = useState<'connecting' | 'online' | 'offline'>('pocket-sse-status', () => 'offline');
  let currentCallback: ((payload: RealtimePayload) => void) | null = null;

  // 核心：强制销毁连接并重置状态
  const destroyConnection = () => {
    if (sseManager.instance) {
      sseManager.instance.close();
      sseManager.instance = null;
    }
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

    // 如果已有连接且正常，直接返回
    if (sseManager.instance && sseManager.instance.readyState === 1) {
      status.value = 'online';
      return;
    }

    // 如果正在连接中，不要重复触发
    if (status.value === 'connecting') return;

    status.value = 'connecting';
    const allCollections = ['posts', 'comments', 'likes'];
    const colsParam = encodeURIComponent(allCollections.join(','));

    // 加上时间戳防止某些层级的缓存
    const es = new EventSource(`/api/realtime?cols=${colsParam}&t=${Date.now()}`, {
      withCredentials: true,
    });

    const startHeartbeat = () => {
      clearInterval(sseManager.heartbeatTimer);
      sseManager.lastActivity = Date.now();

      // 调整为 30 秒检查一次
      sseManager.heartbeatTimer = setInterval(() => {
        const threshold = 60000; // 判定超时阈值延长至 60 秒
        if (Date.now() - sseManager.lastActivity > threshold) {
          reconnect();
        }
      }, 30000);
    };

    const reconnect = () => {
      destroyConnection();
      const delay = Math.min(1000 * Math.pow(2, sseManager.retryCount), 30000);
      sseManager.retryTimer = setTimeout(() => {
        sseManager.retryCount++;
        connectPhysical();
      }, delay);
    };

    es.onopen = () => {
      status.value = 'online';
      sseManager.retryCount = 0;
      startHeartbeat();
    };

    es.onmessage = () => {
      sseManager.lastActivity = Date.now();
    };

    // 监听所有业务事件
    allCollections.forEach((col) => {
      es.addEventListener(col, (event: MessageEvent) => {
        sseManager.lastActivity = Date.now();
        try {
          const data = JSON.parse(event.data);
          const payload: RealtimePayload = {
            collection: col,
            action: data.action,
            record: data.record,
          };
          sseManager.subscribers.forEach((cb) => cb(payload));
        } catch (e) {}
      });
    });

    es.onerror = () => {
      reconnect();
    };

    sseManager.instance = es;
  };

  // --- 新增：处理系统休眠唤醒和页面卸载 ---
  if (import.meta.client && !(window as any).SSE_GLOBAL_INIT) {
    (window as any).SSE_GLOBAL_INIT = true;

    // 1. 页面关闭/刷新前强制断开，释放浏览器连接槽位
    window.addEventListener('beforeunload', () => {
      destroyConnection();
    });

    // 2. 电脑休眠唤醒或网络切换后，EventSource 往往会卡死，强制重启
    window.addEventListener('online', () => {
      // console.log('[SSE] 网络恢复，重启连接');
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
      }, 2000); // 缩短缓冲时间
    }
  };

  onUnmounted(() => close());

  return { listen, status: readonly(status), close };
};

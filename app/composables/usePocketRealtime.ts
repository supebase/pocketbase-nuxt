import type { RealtimePayload } from '~/types';

/**
 * 全局 SSE 管理器（单例）
 */
const sseManager = {
  instance: null as EventSource | null,
  subscribers: new Set<(payload: RealtimePayload) => void>(),
  isConnecting: false,
  retryCount: 0,
  retryTimer: null as ReturnType<typeof setTimeout> | null,
  heartbeatTimer: null as ReturnType<typeof setInterval> | null,
  lastActivity: Date.now(),
  cleanupTimer: null as ReturnType<typeof setTimeout> | null,
  MAX_RETRY_COUNT: 10,
  clientId:
    typeof window !== 'undefined'
      ? localStorage.getItem('sse_cid') ||
        (() => {
          const id = crypto.randomUUID();
          localStorage.setItem('sse_cid', id);
          return id;
        })()
      : '',
};

export const usePocketRealtime = () => {
  const status = useState<'connecting' | 'online' | 'offline'>('pocket-sse-status', () => 'offline');

  // 核心修复点：使用 Set 严格跟踪当前 Hook 实例产生的回调引用
  const localSubscribers = new Set<(payload: RealtimePayload) => void>();

  /**
   * 彻底断开物理连接并清理所有定时器
   */
  const destroyConnection = () => {
    if (sseManager.instance) {
      sseManager.instance.close();
      sseManager.instance = null;
    }
    sseManager.isConnecting = false;

    // 清理所有全局定时器
    if (sseManager.heartbeatTimer) {
      clearInterval(sseManager.heartbeatTimer);
      sseManager.heartbeatTimer = null;
    }
    if (sseManager.retryTimer) {
      clearTimeout(sseManager.retryTimer);
      sseManager.retryTimer = null;
    }
    if (sseManager.cleanupTimer) {
      clearTimeout(sseManager.cleanupTimer);
      sseManager.cleanupTimer = null;
    }

    status.value = 'offline';
  };

  /**
   * 建立物理连接逻辑
   */
  const connectPhysical = () => {
    if (import.meta.server) return;

    // 如果有待执行的清理任务，说明现在又有组件需要连接了，立即拦截清理
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

    const allCollections = ['posts', 'comments', 'likes', 'notifications'];
    const colsParam = encodeURIComponent(allCollections.join(','));

    // 组合唯一 URL：包含业务集合、客户端 ID、以及防缓存时间戳
    const url = `/api/realtime?cols=${colsParam}&cid=${sseManager.clientId}&t=${Date.now()}`;

    const es = new EventSource(url, {
      withCredentials: true,
    });

    const reconnect = () => {
      destroyConnection();

      // 检查是否超过最大重试次数
      if (sseManager.retryCount >= sseManager.MAX_RETRY_COUNT) {
        // console.warn('[SSE] 达到最大重试次数，停止自动连接');
        status.value = 'offline';
        return;
      }

      // 指数退避算法 + Jitter (抖动)
      // 基础延迟: 1s, 2s, 4s, 8s, 16s, 30s...
      const baseDelay = Math.min(1000 * Math.pow(2, sseManager.retryCount), 30000);
      // 引入 0-50% 的随机抖动，分散后端压力
      const jitter = baseDelay * Math.random() * 0.5;
      const delay = baseDelay + jitter;

      // console.log(`[SSE] 将在 ${Math.round(delay / 1000)}s 后进行第 ${sseManager.retryCount + 1} 次重连`);

      sseManager.retryTimer = setTimeout(() => {
        sseManager.retryCount++;
        connectPhysical();
      }, delay);
    };

    const updateActivity = () => {
      sseManager.lastActivity = Date.now();
    };

    const startHeartbeat = () => {
      if (sseManager.heartbeatTimer) clearInterval(sseManager.heartbeatTimer);
      updateActivity();
      sseManager.heartbeatTimer = setInterval(() => {
        const threshold = 120000;
        if (Date.now() - sseManager.lastActivity > threshold) {
          reconnect();
        }
      }, 60000);
    };

    es.onopen = () => {
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
          // 广播：这里要检查订阅者是否依然存在
          sseManager.subscribers.forEach((cb) => {
            if (typeof cb === 'function') {
              cb(payload);
            } else {
              sseManager.subscribers.delete(cb); // 自动清理无效引用
            }
          });
        } catch (e) {
          /* Parse error */
        }
      });
    });

    es.onerror = (e) => {
      sseManager.isConnecting = false;
      // 只有在非手动关闭，且连接确实失败的情况下才重连
      if (es.readyState === EventSource.CLOSED) {
        reconnect();
      }
    };

    sseManager.instance = es;
  };

  /**
   * 公开 API：监听实时数据
   */
  const listen = (callback: (payload: RealtimePayload) => void) => {
    if (import.meta.server) return;

    if (!sseManager.subscribers.has(callback)) {
      sseManager.subscribers.add(callback);
      localSubscribers.add(callback);
      connectPhysical();
    }
  };

  /**
   * 公开 API：停止监听
   */
  const close = (callback?: (payload: RealtimePayload) => void) => {
    if (callback) {
      sseManager.subscribers.delete(callback);
      localSubscribers.delete(callback);
    } else {
      // 修复：批量从全局管理器中彻底移除当前实例的所有回调
      localSubscribers.forEach((cb) => {
        sseManager.subscribers.delete(cb);
      });
      localSubscribers.clear();
    }

    // 物理连接延迟关闭逻辑
    if (sseManager.subscribers.size === 0 && sseManager.instance) {
      if (sseManager.cleanupTimer) clearTimeout(sseManager.cleanupTimer);
      sseManager.cleanupTimer = setTimeout(() => {
        // 二次确认：在 2 秒延迟期间没有新订阅者加入才断开
        if (sseManager.subscribers.size === 0) {
          destroyConnection();
        }
      }, 2000);
    }
  };

  // 核心修复：确保生命周期钩子在客户端环境可靠执行
  onUnmounted(() => {
    close();
  });

  return {
    listen,
    status: readonly(status),
    close,
  };
};

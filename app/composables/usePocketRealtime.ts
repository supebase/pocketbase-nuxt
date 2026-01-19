/**
 * 状态定义：
 * 1. 使用 useState 确保状态在 SSR 序列化时是安全的，且全应用共享连接状态。
 * 2. 物理连接实例 (EventSource) 和 订阅者集合 (Set) 放在客户端单例对象中。
 */

interface RealtimePayload {
  collection: string;
  action: string;
  record: any;
}

// 客户端特有的单例管理容器，避免全局变量直接暴露在模块顶层
const sseManager = {
  instance: null as EventSource | null,
  subscribers: new Set<(payload: RealtimePayload) => void>(),
  retryCount: 0,
  retryTimer: null as any,
};

export const usePocketRealtime = () => {
  // Nuxt 响应式状态：所有调用该 composable 的组件共享此状态
  const status = useState<'connecting' | 'online' | 'offline'>('pocket-sse-status', () => 'offline');

  // 当前组件的回调引用，用于卸载
  let currentCallback: ((payload: RealtimePayload) => void) | null = null;

  /**
   * 建立物理连接（内部逻辑）
   */
  const connectPhysical = () => {
    // 严禁在服务端运行，防止内存泄漏和跨用户污染
    if (import.meta.server) return;

    // 状态检查：如果正在连接或已连接，则跳过
    if (status.value === 'connecting') return;
    if (sseManager.instance && sseManager.instance.readyState === 1) {
      status.value = 'online';
      return;
    }

    status.value = 'connecting';

    const allCollections = ['posts', 'comments', 'likes'];
    const colsParam = encodeURIComponent(allCollections.join(','));

    // 创建原生 EventSource
    const es = new EventSource(`/api/realtime?cols=${colsParam}`, {
      withCredentials: true,
    });

    es.onopen = () => {
      status.value = 'online';
      sseManager.retryCount = 0;
      console.log('[SSE] 全局物理连接已建立');
    };

    // 监听特定集合事件
    allCollections.forEach((col) => {
      es.addEventListener(col, (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          const payload: RealtimePayload = {
            collection: col,
            action: data.action,
            record: data.record,
          };
          // 广播给所有组件订阅者
          sseManager.subscribers.forEach((cb) => cb(payload));
        } catch (e) {
          console.error(`[SSE] 解析事件数据失败 (${col}):`, e);
        }
      });
    });

    es.onerror = () => {
      status.value = 'offline';
      es.close();
      sseManager.instance = null;

      // 指数退避重连
      const delay = Math.min(1000 * Math.pow(2, sseManager.retryCount), 30000);
      console.warn(`[SSE] 连接已断开，${delay}ms 后重试...`);

      clearTimeout(sseManager.retryTimer);
      sseManager.retryTimer = setTimeout(() => {
        sseManager.retryCount++;
        connectPhysical();
      }, delay);
    };

    sseManager.instance = es;
  };

  /**
   * 暴露给组件的接口：监听消息
   */
  const listen = (callback: (payload: RealtimePayload) => void) => {
    if (import.meta.server) return;

    // 避免同一个组件的回调被重复添加
    if (sseManager.subscribers.has(callback)) return;

    currentCallback = callback;
    sseManager.subscribers.add(callback);

    // 只要有组件开始监听，就确保物理连接存在
    connectPhysical();
  };

  /**
   * 暴露给组件的接口：主动关闭
   */
  const close = () => {
    if (currentCallback) {
      sseManager.subscribers.delete(currentCallback);
      currentCallback = null;
    }

    // 可选：如果没有任何订阅者了，可以在这里关闭物理连接以节省资源
    // if (sseManager.subscribers.size === 0 && sseManager.instance) {
    //   sseManager.instance.close();
    //   sseManager.instance = null;
    //   status.value = 'offline';
    // }
  };

  // 组件卸载自动清理
  onUnmounted(() => {
    close();
  });

  return {
    listen,
    status: readonly(status), // 状态只读，防止组件意外修改
    close,
  };
};

// 1. 全局状态（定义在函数外部，确保内存中只有一份）
const globalEventSource = ref<EventSource | null>(null);
const globalStatus = ref<'connecting' | 'online' | 'offline'>('offline');
const subscribers = new Set<(payload: any) => void>();

// 重连配置
let retryCount = 0;
let retryTimer: NodeJS.Timeout | null = null;

export const usePocketRealtime = (collections: string[]) => {
  // 记录当前组件的回调引用，用于卸载时精准移除
  let currentCallback: ((payload: any) => void) | null = null;

  /**
   * 关闭/注销逻辑
   */
  const close = () => {
    if (currentCallback) {
      subscribers.delete(currentCallback);
      currentCallback = null;
    }

    // 调试日志：查看当前活跃订阅数
    // console.log(`[SSE] 组件卸载，剩余订阅数: ${subscribers.size}`);

    // 可选：如果希望在没有任何组件使用实时功能时断开连接，取消下面注释
    /*
    if (subscribers.size === 0 && globalEventSource.value) {
      globalEventSource.value.close();
      globalEventSource.value = null;
      globalStatus.value = 'offline';
    }
    */
  };

  /**
   * 建立物理连接（内部私有函数）
   */
  const connectPhysical = () => {
    if (import.meta.server || globalStatus.value === 'connecting') return;

    // 如果已经有在线的连接，不需要重新创建
    if (globalEventSource.value && globalEventSource.value.readyState === 1) {
      globalStatus.value = 'online';
      return;
    }

    globalStatus.value = 'connecting';

    // 关键：订阅所有可能用到的核心集合，确保全局连接的通用性
    const allCollections = ['posts', 'comments', 'likes'];
    const colsParam = allCollections.join(',');

    const es = new EventSource(`/api/realtime?cols=${colsParam}`, {
      withCredentials: true,
    });

    es.onopen = () => {
      globalStatus.value = 'online';
      retryCount = 0;
      console.log('[SSE] 全局物理连接建立成功');
    };

    // 绑定事件处理器
    allCollections.forEach((col) => {
      es.addEventListener(col, (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          // 核心：将收到的消息分发给所有活跃的订阅者
          subscribers.forEach((cb) => {
            cb({
              collection: col,
              action: data.action,
              record: data.record,
            });
          });
        } catch (e) {
          console.error(`[SSE] 解析数据失败 (${col}):`, e);
        }
      });
    });

    es.onerror = () => {
      globalStatus.value = 'offline';
      es.close();

      // 指数退避重连逻辑
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
      retryTimer = setTimeout(() => {
        retryCount++;
        connectPhysical();
      }, delay);
    };

    globalEventSource.value = es;
  };

  /**
   * 暴露给组件的监听接口
   */
  const listen = (callback: (payload: any) => void) => {
    if (import.meta.server) return;

    // 保存引用以便后续移除
    currentCallback = callback;
    subscribers.add(currentCallback);

    // 确保物理连接已开启
    connectPhysical();
  };

  // 组件自动卸载清理
  onUnmounted(() => {
    close();
  });

  return { listen, status: globalStatus, close };
};

export const usePocketRealtime = (collections: string[]) => {
  const eventSource = ref<EventSource | null>(null);

  // 💡 修改点 1：将 listen 逻辑改为立即执行或由组件显式调用
  const listen = (
    callback: (payload: { collection: string; action: string; record: any }) => void
  ) => {
    if (import.meta.server) return;

    // 如果已经有连接，先关闭，防止重复订阅
    if (eventSource.value) {
      eventSource.value.close();
    }

    const colsParam = collections.join(',');
    // 💡 修改点 2：添加 withCredentials，确保 SSE 请求携带 Auth Cookie
    const es = new EventSource(`/api/realtime?cols=${colsParam}`, {
      withCredentials: true,
    });

    collections.forEach((col) => {
      es.addEventListener(col, (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          // 💡 修改点 3：确保 record 结构存在
          if (data && data.record) {
            callback({
              collection: col,
              action: data.action,
              record: data.record,
            });
          }
        } catch (e) {
          console.error(`[SSE] 解析 ${col} 数据失败:`, e);
        }
      });
    });

    // 监听错误，方便调试
    es.onerror = (err) => {
      console.error('[SSE] 连接发生错误，状态码:', es.readyState);
    };

    eventSource.value = es;
  };

  onUnmounted(() => {
    if (eventSource.value) {
      eventSource.value.close();
      eventSource.value = null;
    }
  });

  return { listen };
};

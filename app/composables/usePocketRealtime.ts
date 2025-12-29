export const usePocketRealtime = (collections: string[]) => {
  const eventSource = ref<EventSource | null>(null);

  const listen = (
    callback: (payload: { collection: string; action: string; record: any }) => void
  ) => {
    // 只有在客户端环境才执行
    if (import.meta.server) return;

    const colsParam = collections.join(',');
    const es = new EventSource(`/api/realtime?cols=${colsParam}`);

    collections.forEach((col) => {
      es.addEventListener(col, (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          callback({ collection: col, action: data.action, record: data.record });
        } catch (e) {
          console.error('解析实时数据失败', e);
        }
      });
    });

    eventSource.value = es;
  };

  // 仅在客户端组件卸载时关闭
  onUnmounted(() => {
    if (import.meta.client) {
      eventSource.value?.close();
    }
  });

  return { listen };
};

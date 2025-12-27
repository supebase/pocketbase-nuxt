import type { RecordModel, RecordSubscription } from 'pocketbase';

interface RealtimeOptions<T> {
  topic?: string;
  fields?: string;
  expand?: string;
  onUpdate?: (event: RecordSubscription<T>) => void;
}

export const usePocketRealtime = <T extends RecordModel>(collectionName: string) => {
  const { $pb } = useNuxtApp();
  const isConnected = ref(false);
  let activeTopic: string | null = null;

  // 1. 定义取消订阅的内部函数
  const stop = async () => {
    if (activeTopic) {
      try {
        await $pb.collection(collectionName).unsubscribe(activeTopic);
        activeTopic = null;
        isConnected.value = false;
      } catch (e) {
        // 忽略静默失败
      }
    }
  };

  if (import.meta.client) {
    // 💡 监听全局认证状态：如果用户登出，强制切断订阅
    // 这是为了配合 plugins/pocketbase.client.ts 中的同步逻辑
    watch(
      () => $pb.authStore.token,
      (newToken) => {
        if (!newToken && isConnected.value) {
          console.log(`[Realtime] Auth lost, stopping subscription for ${collectionName}`);
          stop();
        }
      }
    );

    onUnmounted(() => {
      stop();
    });
  }

  const stream = async (options: RealtimeOptions<T> = {}) => {
    if (!import.meta.client) return;

    // 💡 防止重复订阅
    if (isConnected.value) await stop();

    const { topic = '*', onUpdate, expand, fields } = options;
    activeTopic = topic;

    try {
      await $pb.collection(collectionName).subscribe<T>(topic, async (event) => {
        let record = event.record;

        // 处理数据补全逻辑 (expand/fields)
        if ((expand || fields) && event.action !== 'delete') {
          try {
            const fullRecord = await $pb.collection(collectionName).getOne<T>(record.id, {
              expand,
              fields,
              requestKey: `rt-sync-${record.id}`,
            });
            if (fullRecord) record = fullRecord;
          } catch (e: any) {
            if (e?.isAbort) return;
            // 💡 如果是 404/403，说明权限在推送瞬间发生了变化（例如记录变私有了）
            console.warn('[Realtime] Data sync failed', e);
          }
        }

        if (onUpdate) onUpdate({ ...event, record });
      });

      isConnected.value = true;
    } catch (err) {
      console.error(`[Realtime] Failed to subscribe to ${collectionName}`, err);
      isConnected.value = false;
    }
  };

  return { isConnected, stream, stop };
};

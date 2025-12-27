import type { RecordModel, RecordSubscription } from 'pocketbase';

interface RealtimeOptions<T> {
  topic?: string;
  fields?: string; // 指定拉取的字段，提升性能
  expand?: string;
  onUpdate?: (event: RecordSubscription<T>) => void;
}

export const usePocketRealtime = <T extends RecordModel>(collectionName: string) => {
  const { $pb } = useNuxtApp();
  const isConnected = ref(false);
  let activeTopic: string | null = null;

  if (import.meta.client) {
    onUnmounted(() => {
      if (activeTopic) $pb.collection(collectionName).unsubscribe(activeTopic);
    });
  }

  const stream = async (options: RealtimeOptions<T> = {}) => {
    if (!import.meta.client) return;
    const { topic = '*', onUpdate, expand, fields } = options;
    activeTopic = topic;

    await $pb.collection(collectionName).subscribe<T>(topic, async (event) => {
      let record = event.record;

      if ((expand || fields) && event.action !== 'delete') {
        try {
          const fullRecord = await $pb.collection(collectionName).getOne<T>(record.id, {
            expand,
            fields,
            requestKey: `rt-sync-${record.id}`,
          });
          if (fullRecord) record = fullRecord;
        } catch (e: any) {
          // 💡 关键修正：判断是否为自动取消
          if (e?.isAbort) {
            // 这是正常的 SDK 行为，直接忽略，不打印错误
            return;
          }
          console.warn('[Realtime] 获取补充数据失败', e);
        }
      }

      if (onUpdate) onUpdate({ ...event, record });
    });
    isConnected.value = true;
  };

  return { isConnected, stream };
};

import type { RecordModel, RecordSubscription } from 'pocketbase';
import { onUnmounted, ref, type Ref } from 'vue';

interface RealtimeOptions<T> {
    topic?: string;
    onUpdate?: (event: RecordSubscription<T>) => void;
}

export const usePocketRealtime = <T extends RecordModel>(collectionName: string) => {
    const { $pb } = useNuxtApp();

    const data: Ref<T[]> = ref([]);
    const isConnected = ref(false);

    // 核心修正：在 setup 同步阶段定义一个变量存储当前的 topic
    // 这样我们才能在 onUnmounted 中正确取消订阅
    let activeTopic: string | null = null;

    // 1. 立即在同步阶段注册生命周期钩子
    if (import.meta.client) {
        onUnmounted(() => {
            if (activeTopic) {
                $pb.collection(collectionName).unsubscribe(activeTopic);
                // console.log(`[Realtime] Unsubscribed from ${collectionName}/${activeTopic}`);
            }
        });
    }

    const defaultSyncHandler = (event: RecordSubscription<T>) => {
        switch (event.action) {
            case 'create':
                data.value = [event.record, ...data.value];
                break;
            case 'update':
                data.value = data.value.map(item => item.id === event.record.id ? event.record : item);
                break;
            case 'delete':
                data.value = data.value.filter(item => item.id !== event.record.id);
                break;
        }
    };

    // 2. stream 函数现在只负责启动连接
    const stream = async (options: RealtimeOptions<T> = {}) => {
        if (!import.meta.client) return;

        const { topic = '*', onUpdate } = options;
        activeTopic = topic; // 记录 topic 供销毁钩子使用

        await $pb.collection(collectionName).subscribe<T>(topic, (event) => {
            if (onUpdate) {
                onUpdate(event);
            } else {
                defaultSyncHandler(event);
            }
        });

        isConnected.value = true;
    };

    return {
        data,
        isConnected,
        stream,
        pb: $pb
    };
};
import PocketBase, { type RecordSubscription } from 'pocketbase';

// 在外部定义，确保单例连接，避免每个组件都新建 SSE 链接
let pbInstance: PocketBase | null = null;

function getClientPB() {
  if (import.meta.server) return null;
  if (!pbInstance) {
    pbInstance = new PocketBase('/_pb');
    pbInstance.autoCancellation(false);
  }
  return pbInstance;
}

export const usePocketRealtime = () => {
  const pb = getClientPB();

  const listen = async (collection: string, callback: (payload: any) => void, options: { expand?: string } = {}) => {
    if (!pb || import.meta.server) return;

    // 每次订阅前同步最新的 Cookie 状态（处理登录/登出切换）
    pb.authStore.loadFromCookie(document.cookie);

    try {
      // 官方 SDK 会自动管理多重订阅，如果已经订阅过同一个 collection，它会合并处理
      await pb.collection(collection).subscribe(
        '*',
        (e: RecordSubscription) => {
          callback({
            collection,
            action: e.action,
            record: e.record,
          });
        },
        options,
      );
    } catch (err) {
      console.error(`[PB Realtime] 订阅失败: ${collection}`, err);
    }
  };

  const close = (collection?: string) => {
    if (!pb) return;
    if (collection) {
      // 只取消当前组件关心的订阅
      pb.collection(collection).unsubscribe('*');
    } else {
      // 如果不传参数，保守一点，只取消这个 Hook 实例最常用的几个，或者由开发者手动指定
    }
  };

  // 注意：在 Composable 中使用 onUnmounted 是安全的，
  // 它会自动绑定到调用这个 Hook 的组件生命周期上。
  onUnmounted(() => {
    // 自动清理当前组件的监听（可选，取决于你是否希望切页面后继续听）
  });

  return { listen, close };
};

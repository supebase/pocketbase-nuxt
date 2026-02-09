import { type RecordSubscription } from 'pocketbase';

export const usePocketRealtime = () => {
  const pb = getClientPB();
  const { user, session } = useUserSession();

  const activeSubscriptions = new Set<string>();

  watch(
    () => session.value?.pbToken,
    async (newToken, oldToken) => {
      if (!pb) return;

      // 1. 如果是退出登录（Token 从有到无）
      if (!newToken && oldToken) {
        // 【核心改进】先彻底销毁 realtime 实例的连接，不再仅仅是 unsubscribe 某个集合
        // 这会强制关闭底层的 EventSource 连接
        try {
          // 这里使用 catch 忽略可能已经关闭的连接错误
          await pb.realtime.unsubscribe();
          activeSubscriptions.clear();
        } catch (e) {}

        pb.authStore.clear();
        return;
      }

      // 2. 正常的 Token 同步逻辑
      if (newToken && pb.authStore.token !== newToken) {
        // 如果之前有活跃连接，在更新 Token 前建议先断开，让 SDK 重新建立带新 Token 的连接
        // 这样可以避免 "The current and the previous request authorization don't match"
        if (activeSubscriptions.size > 0) {
          await pb.realtime.unsubscribe().catch(() => {});
        }

        pb.authStore.save(newToken, user.value as any);

        // 如果是中途换号（比如管理员切换），可能需要重新恢复之前的订阅
        // 但通常组件卸载会处理，这里保持简单
      }
    },
    { immediate: true },
  );

  const listen = async (
    collection: string,
    callback: (payload: any) => void,
    options: { expand?: string; filter?: string } = {},
  ) => {
    if (!pb || import.meta.server) return;

    try {
      // 如果当前组件实例已经订阅过这个 collection，先清理掉旧的（仅限本实例）
      if (activeSubscriptions.has(collection)) {
        await pb
          .collection(collection)
          .unsubscribe('*')
          .catch(() => {});
      }

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

      activeSubscriptions.add(collection);
    } catch (err) {
      console.error(`[PB Realtime] 订阅失败: ${collection}`, err);
    }
  };

  const close = (collection?: string) => {
    if (!pb) return;

    if (collection) {
      pb.collection(collection)
        .unsubscribe('*')
        .catch(() => {});
      activeSubscriptions.delete(collection);
    } else {
      // 退出登录或组件销毁时，最安全的方法是直接 unsubscribe 整个 realtime 模块
      activeSubscriptions.forEach((col) => {
        pb.collection(col)
          .unsubscribe('*')
          .catch(() => {});
      });
      activeSubscriptions.clear();

      // 彻底断开底层连接，防止 SDK 自动重连
      if (import.meta.client) {
        pb.realtime.unsubscribe().catch(() => {});
      }
    }
  };

  // 自动化：在组件销毁时自动调用清理，防止开发者忘记
  onUnmounted(() => {
    close();
  });

  return { listen, close };
};

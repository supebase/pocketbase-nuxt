import PocketBase from "pocketbase"; // 导入 PocketBase
import { LocalAuthStore } from "pocketbase";

export default defineNuxtPlugin(() => {
  // 获取运行时配置
  const config = useRuntimeConfig();

  // 创建 PocketBase 实例，使用环境变量中的 URL
  const pbClient = new PocketBase(config.public.pocketbaseUrl);
  pbClient.autoCancellation(true);

  // SSR 兼容性处理：确保在客户端环境下才使用 LocalAuthStore
  // 在 SSR 环境下，LocalAuthStore 会自动回退到内存存储
  if (import.meta.client) {
    // 客户端环境下正常使用 LocalAuthStore
    pbClient.authStore = new LocalAuthStore();
  }

  return {
    provide: {
      pbClient, // 注入 $pbClient (单例)
    },
  };
});

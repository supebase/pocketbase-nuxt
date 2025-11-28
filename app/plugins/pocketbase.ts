import PocketBase from "pocketbase"; // 导入 PocketBase

export default defineNuxtPlugin(() => {
  // 获取运行时配置
  const config = useRuntimeConfig();

  // 创建 PocketBase 实例，使用环境变量中的 URL
  const pbClient = new PocketBase(config.public.pocketbaseUrl);
  pbClient.autoCancellation(true);

  return {
    provide: {
      pbClient, // 注入 $pbClient (单例)
    },
  };
});

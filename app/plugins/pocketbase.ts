import PocketBase from "pocketbase"; // 导入 PocketBase

export default defineNuxtPlugin(() => {
    // 创建 PocketBase 实例
    const pbClient = new PocketBase("https://api.ericdit.com");
    pbClient.autoCancellation(true);

    return {
        provide: {
            pbClient, // 注入 $pbClient (单例)
        },
    }
})
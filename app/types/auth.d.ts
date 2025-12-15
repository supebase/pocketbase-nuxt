import "nuxt-auth-utils";

/**
 * 基础 PocketBase 用户记录类型 (可被服务器端模块引用)
 * 注意：通常 PocketBase 记录包含 created/updated/collectionId 等字段，
 * 但这里只保留了业务所需的字段，作为 UserSession 载荷的来源。
 */
export interface PocketBaseUserRecord {
  id: string;
  email?: string;
  name?: string; // 允许 name 字段可选
  avatar?: string;
  // ... 其他 PocketBase 记录字段，如有需要
}

declare module "#auth-utils" {
  /**
   * UserSession 中的 User 接口继承自 PocketBaseUserRecord，
   * 确保类型一致性。
   */
  interface User extends PocketBaseUserRecord {
    // 这里不再重复 id/email/name/avatar 的定义，继承即可
    // 如果您需要确保 name 字段在 UserSession 中是必填的，则可以再次定义：
    // name: string;
  }

  interface UserSession {
    user: User;
    // ...
  }
}

// 导出空对象以确保文件被视为模块
export {};
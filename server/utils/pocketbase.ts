// server/utils/pocketbase.ts
import PocketBase from 'pocketbase';
import type { TypedPocketBase } from '~/types/pocketbase-types';
import type { H3Event } from 'h3';
import { EventSource } from 'eventsource';

/**
 * 模块级全局变量，用于缓存管理员实例。
 * 只要 Nitro 服务进程不重启，该实例就会保留在内存中，避免重复登录。
 */
let systemPbInstance: TypedPocketBase | null = null;

/**
 * 内部私有函数：创建并配置 PocketBase 基础实例
 */
function createBaseInstance() {
  const config = useRuntimeConfig();

  // 1. 处理 Node.js 环境下的 EventSource 补丁（用于 SSE/实时订阅支持）
  if (typeof global !== 'undefined' && !global.EventSource) {
    (global as any).EventSource = EventSource;
  }

  // 2. 初始化实例
  const pb = new PocketBase(config.pocketbaseBackend) as TypedPocketBase;

  // 3. 禁用自动取消，防止服务端请求因并发干扰而中断
  pb.autoCancellation(false);

  return pb;
}

/**
 * 获取用户级 PocketBase 实例
 * 权限受 PocketBase 后端 API Rules 限制。
 * @param event Nitro 请求事件，用于提取 Cookie 维持登录态
 */
export function getPocketBase(event?: H3Event) {
  const pb = createBaseInstance();

  if (event) {
    const cookieHeader = getHeader(event, 'cookie') || '';
    // 从 Cookie 中恢复 pb_auth 状态
    pb.authStore.loadFromCookie(cookieHeader, 'pb_auth');
  }

  return pb;
}

/**
 * 获取系统管理员（超级用户）实例
 * 权限最高，无视 API Rules。采用单例模式优化性能。
 */
export async function getSystemClient() {
  // 1. 如果已有缓存实例且 Token 未过期，直接返回
  if (systemPbInstance && systemPbInstance.authStore.isValid) {
    return systemPbInstance;
  }

  // 2. 否则创建新实例并重新认证
  const pb = createBaseInstance();
  const config = useRuntimeConfig();

  // 优先从 runtimeConfig 读取，兼容环境变量
  const adminEmail = config.pbAdminEmail || process.env.NUXT_PB_ADMIN_EMAIL;
  const adminPassword = config.pbAdminPassword || process.env.NUXT_PB_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error('[PocketBase] 缺少管理员凭据配置');
  }

  try {
    // 适配 PocketBase v0.22+ 的新超级用户集合名称
    await pb.collection('_superusers').authWithPassword(adminEmail, adminPassword);

    // 3. 存入单例缓存
    systemPbInstance = pb;
    console.log('[PocketBase] 系统管理员实例已初始化并缓存');
    return systemPbInstance;
  } catch (error) {
    console.error('[PocketBase] 管理员登录失败:', error);
    throw error;
  }
}

import PocketBase from 'pocketbase';
import type { TypedPocketBase } from '~/types/pocketbase-types';
import type { H3Event } from 'h3';
import { EventSource } from 'eventsource';

// 处理 Node.js 环境下的 EventSource 补丁（用于 SSE/实时订阅支持）
if (typeof global !== 'undefined' && !global.EventSource) {
  (global as any).EventSource = EventSource;
}

/**
 * 内部私有函数：创建并配置 PocketBase 基础实例
 */
function createBaseInstance() {
  const config = useRuntimeConfig();

  // 初始化实例
  const pb = new PocketBase(config.pocketbaseBackend) as TypedPocketBase;

  // 禁用自动取消，防止服务端请求因并发干扰而中断
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

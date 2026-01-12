/**
 * @file PocketBase Client Factory
 * @description 负责在 Nuxt 服务端初始化 PocketBase 实例，并同步用户认证状态。
 */

import PocketBase from 'pocketbase';
import type { TypedPocketBase } from '~/types/pocketbase-types';
import type { H3Event } from 'h3';
import { EventSource } from 'eventsource';

// Node.js 环境兼容：为 PocketBase 的实时订阅 (SSE) 提供 EventSource 支持
if (typeof global !== 'undefined' && !global.EventSource) {
  (global as any).EventSource = EventSource;
}

/**
 * 创建基础配置实例
 * @private
 */
function createBaseInstance() {
  const config = useRuntimeConfig();
  const pb = new PocketBase(config.pocketbaseBackend) as TypedPocketBase;

  // 重要：服务端必须禁用自动取消，以防并发请求下旧请求被新请求取消
  pb.autoCancellation(false);

  return pb;
}

/**
 * 获取关联用户状态的 PocketBase 实例
 * @param event - H3Event (可选)。若传入则自动从 Request Cookie 中恢复认证状态。
 * @description 权限受 PocketBase 后端 API Rules 约束。
 */
export function getPocketBase(event?: H3Event) {
  const pb = createBaseInstance();

  if (event) {
    const cookieHeader = getHeader(event, 'cookie') || '';
    // 从 Cookie 中还原 authStore (pb_auth 字段)
    pb.authStore.loadFromCookie(cookieHeader, 'pb_auth');
  }

  return pb;
}

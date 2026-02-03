/**
 * @file PocketBase Client Factory
 * @description 负责在 Nuxt 服务端初始化 PocketBase 实例，并同步用户认证状态。
 */
import PocketBase from 'pocketbase';
import type { TypedPocketBase } from '~/types';
import type { H3Event } from 'h3';
import { EventSource } from 'eventsource';

// Node.js 环境兼容：为 PocketBase 的实时订阅 (SSE) 提供全局 EventSource
if (import.meta.server && !global.EventSource) {
  (global as any).EventSource = EventSource;
}

/**
 * 创建基础配置实例
 */
function createBaseInstance() {
  const config = useRuntimeConfig();
  const pb = new PocketBase(config.pocketbaseBackend) as TypedPocketBase;

  // 必须禁用：服务端高并发环境下防止请求相互竞争取消
  pb.autoCancellation(false);

  return pb;
}

/**
 * 获取关联用户状态的 PocketBase 实例
 */
export function getPocketBase(event?: H3Event) {
  // 1. 如果当前请求已经初始化过实例，直接返回（单例模式）
  if (event?.context.pb) {
    return event.context.pb as TypedPocketBase;
  }

  const pb = createBaseInstance();

  // 2. 如果提供了 event，从 Cookie 同步身份
  if (event) {
    const cookieHeader = getRequestHeader(event, 'cookie') || '';
    // 注意：PocketBase 默认 Cookie 名通常是 'pb_auth'
    pb.authStore.loadFromCookie(cookieHeader, 'pb_auth');

    // 3. 注入缓存，确保中间件和后续 API 路由共用此实例
    event.context.pb = pb;
  }

  return pb;
}

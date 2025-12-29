/**
 * @file 服务端 PocketBase 工具函数
 * @description 该文件提供用于在服务端环境中创建和管理 PocketBase 实例的核心功能，
 *              并包含一些与用户身份和数据处理相关的辅助函数。
 */

import PocketBase from 'pocketbase';
// 导入自动生成的 PocketBase 类型定义，以增强与数据库集合交互时的类型安全性。
import type { TypedPocketBase } from '~/types/pocketbase-types';
// 导入 H3Event 类型，用于在 Nitro 服务端路由中获取请求上下文。
import type { H3Event } from 'h3';

/**
 * 获取一个经过身份验证和配置的 PocketBase 服务端实例。
 * 这个函数是与 PocketBase 后端进行所有服务端交互的入口点。
 *
 * @param event 可选的 H3Event 对象。如果提供此参数，函数将自动从传入请求的 Cookie 中
 *              加载用户的身份验证信息。这对于需要用户登录状态的 API 请求至关重要。
 * @returns 返回一个功能完整且类型安全的 PocketBase 实例 (TypedPocketBase)。
 */
export function getPocketBaseInstance(event?: H3Event) {
  // `useRuntimeConfig` 用于安全地访问在 `nuxt.config.ts` 中定义的环境变量。
  const config = useRuntimeConfig();

  // 创建一个新的 PocketBase 实例，并连接到配置中指定的后端服务 URL。
  // 注意：这里使用的是服务端的内部地址 (config.pocketbaseBackend)，而不是面向公众的 URL，
  // 这样做更安全、网络延迟也更低。
  const pb = new PocketBase(config.pocketbaseBackend) as TypedPocketBase;

  // 禁用请求的自动取消功能。在服务端环境中，我们通常需要确保请求能够完整执行，
  // 而不是像在客户端那样因为页面导航等原因被自动取消。
  pb.autoCancellation(false);

  // 如果 `event` 对象存在，说明这是一个真实的服务器请求上下文。
  if (event) {
    // 💡 从请求头中提取 'cookie' 字符串。这是实现会话和状态保持的关键步骤。
    // 如果没有 cookie，则提供一个空字符串以避免错误。
    const cookieHeader = getHeader(event, 'cookie') || '';

    // 使用 PocketBase SDK 的内置功能，从 cookie 中加载认证状态。
    // 'pb_auth' 是 PocketBase 默认用来存储认证令牌的 cookie 名称。
    // 这行代码执行后，后续所有使用此 `pb` 实例发起的 API 请求都将自动携带用户的认证头信息。
    pb.authStore.loadFromCookie(cookieHeader, 'pb_auth');
  }

  // 返回已配置好的 PocketBase 实例，可供上层 service 或 API handler 使用。
  return pb;
}

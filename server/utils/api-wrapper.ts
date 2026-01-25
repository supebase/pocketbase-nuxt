/**
 * @file API Handler Wrapper
 * @description 统一 API 处理器包装函数。集成 CSRF 安全校验、异常捕获以及 PocketBase 错误格式化。
 */

import type { H3Event, EventHandlerRequest } from 'h3';
import { handlePocketBaseError } from './error-handler';

/**
 * 定义标准 API 处理程序
 * @param handler 业务处理函数
 * @description
 * 1. [安全] 针对写操作执行 Origin 校验，防止 CSRF 攻击。
 * 2. [异常] 统一捕获业务错误，并将 PB SDK 错误转换为标准 API 响应。
 */
export const defineApiHandler = <D>(
  // 关键改动：给 H3Event 加上泛型参数，或者直接使用最基础的 H3Event 类型
  handler: (event: H3Event<any>) => Promise<D> | D,
) => {
  return defineEventHandler(async (event) => {
    try {
      // CSRF 安全校验 (仅限生产环境的写操作)
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(event.method)) {
        const origin = getHeader(event, 'origin');
        const host = getHeader(event, 'host');

        if (process.env.NODE_ENV === 'production' && origin && host) {
          try {
            const originHost = new URL(origin).host;

            // 严格一致性校验：阻止任何第三方域名的跨站调用
            if (originHost !== host) {
              throw createError({
                status: 403,
                message: '跨站请求校验失败 (CSRF Protection)',
                statusText: 'Forbidden',
              });
            }
          } catch (e) {
            throw createError({
              status: 403,
              message: '无效的请求来源 (Invalid Origin)',
              statusText: 'Forbidden',
            });
          }
        }
      }

      // 执行核心业务逻辑
      return await handler(event);
    } catch (error: any) {
      // 错误分流处理

      // 若为 H3 内部生成的标准错误，保持原有链路抛出
      if (error.statusCode && !error.originalError && !error.data?.isPocketBase) {
        throw error;
      }
      // 若为 PocketBase SDK 抛出的异常，交由错误转换器处理
      // 确保返回给前端的错误结构统一（如 400 校验错误、404 未找到等）
      return handlePocketBaseError(error, '服务器响应异常');
    }
  });
};

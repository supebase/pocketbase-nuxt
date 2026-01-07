import type { EventHandler, EventHandlerRequest } from 'h3';
import { handlePocketBaseError } from './error-handler';

export const defineApiHandler = <T extends EventHandlerRequest, D>(
  handler: EventHandler<T, D>,
): EventHandler<T, D> => {
  return defineEventHandler(async (event) => {
    try {
      // --- 🔐 增加 CSRF 安全校验 ---
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(event.method)) {
        const origin = getHeader(event, 'origin');
        const host = getHeader(event, 'host');

        // 仅在生产环境下强制校验，避免影响本地开发
        if (process.env.NODE_ENV === 'production' && origin && host) {
          try {
            const originHost = new URL(origin).host;
            if (originHost !== host) {
              throw createError({
                statusCode: 403,
                message: '安全校验失败：跨站请求被拦截 (CSRF Protection)',
              });
            }
          } catch (e) {
            // 如果 Origin URL 格式非法
            throw createError({ statusCode: 403, message: '非法的请求来源' });
          }
        }
      }
      // ----------------------------

      const response = await handler(event);
      return response;
    } catch (error: any) {
      if (error.statusCode && !error.originalError && !error.data?.isPocketBase) {
        throw error;
      }
      return handlePocketBaseError(error, '服务器响应异常');
    }
  }) as EventHandler<T, D>;
};

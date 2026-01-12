import type { EventHandler, EventHandlerRequest } from 'h3';
import { handlePocketBaseError } from './error-handler';

export const defineApiHandler = <T extends EventHandlerRequest, D>(
  handler: EventHandler<T, D>,
): EventHandler<T, D> => {
  return defineEventHandler(async (event) => {
    try {
      // --- 🔐 增加 CSRF 安全校验 ---
      // 仅针对修改数据的请求方法
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(event.method)) {
        const origin = getHeader(event, 'origin');
        const host = getHeader(event, 'host'); // 浏览器访问时的域名

        // 仅在生产环境下强制校验，避免影响本地开发 (localhost)
        if (process.env.NODE_ENV === 'production' && origin && host) {
          try {
            const originHost = new URL(origin).host;

            // 核心校验：来源域名必须与当前访问域名一致
            // 适配 Cloudflare Tunnel，它会传递正确的 Host 头
            if (originHost !== host) {
              throw createError({
                statusCode: 403,
                message: '安全校验失败：禁止跨站请求 (CSRF Protection)',
              });
            }
          } catch (e) {
            throw createError({ statusCode: 403, message: '非法的请求来源 (Invalid Origin)' });
          }
        }
      }

      const response = await handler(event);
      return response;
    } catch (error: any) {
      // 如果是 H3 抛出的标准错误，直接继续抛出，由 Nuxt 统一处理
      if (error.statusCode && !error.originalError && !error.data?.isPocketBase) {
        throw error;
      }
      // 如果是 PocketBase 产生的错误，进入专门的错误转换器
      return handlePocketBaseError(error, '服务器响应异常');
    }
  }) as EventHandler<T, D>;
};

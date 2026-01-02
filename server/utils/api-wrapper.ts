import type { EventHandler, EventHandlerRequest } from 'h3';
import { handlePocketBaseError } from './error-handler';

/**
 * API 高阶包装器
 * 修复了泛型 D 的异步推导问题
 */
export const defineApiHandler = <T extends EventHandlerRequest, D>(handler: EventHandler<T, D>): EventHandler<T, D> => {
    // 使用 @ts-ignore 或者明确指定返回类型为异步
    // 实际上 defineEventHandler 接受返回 Promise 的函数
    return defineEventHandler(async (event) => {
        try {
            // 这里 await 确保了无论原 handler 是同步还是异步，都能捕获错误
            const response = await handler(event);

            return response;
        } catch (error: any) {
            // 1. 如果是已经通过 createError 抛出的标准错误，且不是 PocketBase 的原始错误，则继续抛出
            if (error.statusCode && !error.originalError && !error.data?.isPocketBase) {
                throw error;
            }

            // 2. 统一交给 PocketBase 错误处理器
            // 注意：handlePocketBaseError 应该返回一个标准的对象或抛出 createError
            return handlePocketBaseError(error, '服务器响应异常');
        }
    }) as EventHandler<T, D>; // 强制断言以匹配 h3 的签名
};
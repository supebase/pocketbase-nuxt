/**
 * @file Global Error Handler
 * @description 统一转换 PocketBase 异常为标准的 Nuxt H3 错误，支持多字段校验汇总与中文映射。
 */

import { ClientResponseError } from 'pocketbase';
import { GLOBAL_ERROR_CODE_MAP, FIELD_ERROR_CODE_MAP } from '~/constants/pocketbase';

export function handlePocketBaseError(error: unknown, defaultMessage: string = '请求失败，请稍后再试'): never {
  let friendlyMessage = defaultMessage;
  let status = 500;
  let technicalMessage = 'Internal Server Error';

  // 1. 网络层异常判定
  const isNetworkError =
    (error instanceof TypeError && error.message === 'Failed to fetch') ||
    (error instanceof ClientResponseError && error.status === 0);

  if (isNetworkError) {
    throw createError({
      status: 503,
      message: '无法连接到后端服务，请检查网络或稍后重试。',
      statusText: 'Service Unavailable',
      data: { _isNetworkError: true },
      fatal: false, // API 错误不应导致 SPA 崩溃
    });
  }

  // 2. 非 PB 异常处理（如代码运行时抛出的 ReferenceError 等）
  if (!(error instanceof ClientResponseError)) {
    console.error('[Internal Error]:', error);
    throw createError({
      status: 500,
      message: defaultMessage,
      statusText: 'Internal System Error',
      fatal: false, // 只有在路由中间件或页面 asyncData 中非常关键的数据失败才设为 true
    });
  }

  // 3. 提取 PB 原始错误数据
  status = error.status || 500;
  const errorData = error.data || {};
  technicalMessage = error.message || 'PocketBase Error';

  // 4. 处理字段级校验错误 (Validation Errors)
  if (errorData.data && Object.keys(errorData.data).length > 0) {
    const messages = Object.values(errorData.data).map((details: any) => {
      const rawMsg = details?.message || '格式错误';
      // 这里的映射逻辑很好，保留
      return FIELD_ERROR_CODE_MAP[rawMsg] || rawMsg;
    });

    // 汇总去重
    const uniqueMessages = Array.from(new Set(messages));
    friendlyMessage = uniqueMessages.join('；');
  }
  // 5. 处理全局业务错误
  else {
    const rawMessage = errorData.message || technicalMessage;
    friendlyMessage = GLOBAL_ERROR_CODE_MAP[rawMessage] || rawMessage;
  }

  //

  // 6. 抛出格式化的 Nuxt 错误
  throw createError({
    status,
    message: friendlyMessage,
    // 修正：statusText 应该简短且符合标准，详细信息放 data 里
    statusText: status >= 500 ? 'Internal Server Error' : 'Bad Request',
    data: {
      _isPocketBaseError: true,
      fields: errorData.data || {},
      originalMessage: technicalMessage,
    },
    // 修正：在 API Handler 中，绝大多数情况 fatal 应为 false
    // 只有在渲染页面必不可少的数据报错时，由开发者在页面层决定是否 fatal
    fatal: false,
  });
}

/**
 * @file Global Error Handler
 * @description 统一转换 PocketBase 异常为标准的 Nuxt H3 错误，支持多字段校验汇总与中文映射。
 */

import { ClientResponseError } from 'pocketbase';
import { GLOBAL_ERROR_CODE_MAP, FIELD_ERROR_CODE_MAP } from '~/constants/pocketbase';

/**
 * PocketBase 异常拦截器
 * @description 处理流程：网络检查 -> 实例校验 -> 字段级错误聚合 -> 全局映射 -> 格式化抛出
 * @throws 转换后的 H3Error 对象
 */
export function handlePocketBaseError(error: unknown, defaultMessage: string = '请求失败，请稍后再试'): never {
  let friendlyMessage = defaultMessage;
  let status = 500;
  let technicalMessage = 'Internal Server Error';

  // 网络层异常：处理后端服务宕机或请求被拦截（Status 0）
  const isNetworkError =
    (error instanceof TypeError && error.message === 'Failed to fetch') ||
    (error instanceof ClientResponseError && error.status === 0);

  if (isNetworkError) {
    throw createError({
      status: 503,
      message: '无法连接到后端服务，请检查网络或稍后重试。',
      statusText: 'Service Unavailable',
      data: { _isNetworkError: true },
    });
  }

  // 外部非 PB 异常：处理服务端代码逻辑错误
  if (!(error instanceof ClientResponseError)) {
    console.error('[Internal Error]:', error);
    throw createError({
      status,
      message: defaultMessage,
      statusText: 'Internal System Error',
      fatal: false,
    });
  }

  // 提取 PB 原始错误数据
  status = error.status;
  const errorData = error.data || {};
  technicalMessage = error.message;

  // 处理字段级校验错误 (Validation Errors)
  // 逻辑：遍历 errorData.data 字典，映射所有不合规字段的提示语
  if (errorData.data && Object.keys(errorData.data).length > 0) {
    const messages = Object.values(errorData.data).map((details: any) => {
      const rawMsg = details?.message || '格式错误';
      return FIELD_ERROR_CODE_MAP[rawMsg] || rawMsg;
    });

    // 汇总去重：将多个字段的同类错误（如“必填”）合并显示
    const uniqueMessages = Array.from(new Set(messages));
    friendlyMessage = uniqueMessages.join('；');
  }
  // 处理全局业务错误 (如 403 Forbidden, 404 Not Found)
  else {
    const rawMessage = errorData.message || technicalMessage;
    friendlyMessage = GLOBAL_ERROR_CODE_MAP[rawMessage] || rawMessage;
  }

  // 抛出格式化的 Nuxt 错误，便于前端 useFetch 的 error.data 获取
  throw createError({
    status,
    message: friendlyMessage,
    statusText: technicalMessage.substring(0, 50),
    data: {
      _isPocketBaseError: true,
      fields: errorData.data || {}, // 透传原始字段结构，供前端表单高亮使用
      originalMessage: technicalMessage,
    },
    fatal: status >= 500,
  });
}

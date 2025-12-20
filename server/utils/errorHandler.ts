import { ClientResponseError } from 'pocketbase';

/**
 * PocketBase 顶级业务错误码映射
 */
const GLOBAL_ERROR_CODE_MAP: Record<string, string> = {
  'Something went wrong.': '发生错误，请稍后再试。',
  'Failed to authenticate.': '登录失败，请检查电子邮件或密码。',
  'Something went wrong while processing your request.': '处理请求时出错，请稍后再试。',
  'Failed to create record.': '会话过期，请重新登录。',
};

/**
 * PocketBase 字段级校验错误映射
 */
const FIELD_ERROR_CODE_MAP: Record<string, string> = {
  'Cannot be blank.': '请填写完整的注册信息',
  'Must be a valid email address.': '请输入有效的电子邮件地址',
  'Must be at least 8 character(s).': '密码至少 8 个字符',
  "Values don't match.": '两次输入的密码不一致',
  'Value must be unique.': '电子邮件已被注册，请更换后重试。',
};

/**
 * PocketBase 通用错误处理器 (优化版)
 */
export function handlePocketBaseError(
  error: unknown,
  defaultMessage: string = '请求失败，请稍后再试'
): never {
  let friendlyMessage = defaultMessage;
  let statusCode = 500;
  let technicalMessage = 'Internal Server Error';

  // 1. 处理网络级错误
  const isNetworkError =
    (error instanceof TypeError && error.message === 'Failed to fetch') ||
    (error instanceof ClientResponseError && error.status === 0);

  if (isNetworkError) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Service Unavailable', // 简短描述
      message: '无法连接到服务器，请检查您的网络连接。', // 详细中文信息
      data: { _isNetworkError: true },
    });
  }

  // 2. 确保是 PocketBase 错误
  if (!(error instanceof ClientResponseError)) {
    console.error('非 PB 错误:', error);
    throw createError({
      statusCode,
      statusMessage: 'Internal Error',
      message: defaultMessage,
      fatal: false,
    });
  }

  statusCode = error.status;
  const errorData = error.data || {};
  technicalMessage = error.message; // PocketBase 原生的英文错误信息

  // 3. 字段级校验错误处理
  if (errorData.data && typeof errorData.data === 'object') {
    const firstFieldError = Object.values(errorData.data)[0] as any;
    if (firstFieldError?.message) {
      friendlyMessage = FIELD_ERROR_CODE_MAP[firstFieldError.message] || firstFieldError.message;
    }
  }
  // 4. 全局错误处理
  else {
    const rawMessage = errorData.message || error.message;
    friendlyMessage = GLOBAL_ERROR_CODE_MAP[rawMessage] || rawMessage;
  }

  throw createError({
    statusCode,
    statusMessage: technicalMessage.substring(0, 50), // 确保 statusMessage 不会过长
    message: friendlyMessage, // 将中文提示放在 message 中
    data: {
      _isPocketBaseError: true,
      originalError: errorData, // 可选：将原始错误详情传给前端
    },
    fatal: statusCode >= 500,
  });
}

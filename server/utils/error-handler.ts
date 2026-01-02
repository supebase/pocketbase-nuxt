/**
 * @file 服务端统一错误处理器
 * @description 该文件负责集中处理与 PocketBase 交互时可能发生的各类错误，
 *              将其转换为对前端友好、易于理解的标准化错误响应。
 */

// 从 pocketbase 包中导入 ClientResponseError 类型，这是 PocketBase SDK 抛出的标准错误类型。
import { ClientResponseError } from 'pocketbase';

/**
 * PocketBase 全局性、非字段级别的业务错误消息中文映射。
 * 用于将 PocketBase 返回的通用英文错误信息，翻译成更贴近用户的中文提示。
 */
const GLOBAL_ERROR_CODE_MAP: Record<string, string> = {
  'Something went wrong.': '发生未知错误，请稍后再试。',
  'Failed to authenticate.': '登录认证失败，请检查您的电子邮件或密码是否正确。',
  'Something went wrong while processing your request.': '处理您的请求时出错，请稍后再试。',
  // 这个错误通常在需要认证的接口，但提供的 token 无效或过期时出现。
  'Failed to create record.': '会话已过期或无效，请重新登录后再操作。',
};

/**
 * PocketBase 特定于数据字段的校验错误消息中文映射。
 * 用于处理表单提交时，后端返回的针对具体字段（如 email, password）的验证失败信息。
 */
const FIELD_ERROR_CODE_MAP: Record<string, string> = {
  'Cannot be blank.': '此为必填项，内容不能为空。',
  'Must be a valid email address.': '请输入一个有效的电子邮件地址。',
  'Must be at least 8 character(s).': '密码长度至少需要 8 个字符。',
  "Values don't match.": '您两次输入的密码不一致，请检查。',
  'Value must be unique.': '该电子邮件地址已被注册，请更换后重试。',
};

/**
 * PocketBase 通用错误处理函数 (优化版)。
 * 捕获未知类型的错误，并尝试将其解析为结构化的 HTTP 错误响应。
 * @param error 捕获到的未知错误对象。
 * @param defaultMessage 如果无法从错误中解析出具体信息，则使用此默认的中文提示。
 * @returns 该函数从不 "返回"，而是总是通过 `throw createError` 抛出一个 H3 错误，中断当前执行并触发 Nitro 的错误处理流程。
 */
export function handlePocketBaseError(
  error: unknown,
  defaultMessage: string = '请求失败，请稍后再试'
): never {
  // `never` 类型表示这个函数永远不会正常返回一个值。
  let friendlyMessage = defaultMessage;
  let statusCode = 500;
  let technicalMessage = 'Internal Server Error';

  // 步骤 1: 优先处理网络层面的错误。
  // 这种错误通常发生在无法连接到 PocketBase 服务时（例如，服务宕机、网络不通）。
  const isNetworkError =
    (error instanceof TypeError && error.message === 'Failed to fetch') || // `fetch` 失败的标准错误
    (error instanceof ClientResponseError && error.status === 0); // PocketBase 对网络错误的特殊表现

  if (isNetworkError) {
    // 抛出一个 503 Service Unavailable 错误，明确告知前端问题出在服务端连接上。
    throw createError({
      statusCode: 503,
      message: '无法连接到后端服务，请检查您的网络或稍后重试。', // 给用户看的中文信息
      statusMessage: 'Service Unavailable', // HTTP 状态文本
      data: { _isNetworkError: true }, // 附加元数据，方便前端进行特定处理
    });
  }

  // 步骤 2: 确认错误是来自 PocketBase 的标准错误类型。
  if (!(error instanceof ClientResponseError)) {
    // 如果错误不是 ClientResponseError，说明可能是代码中的其他逻辑错误。
    console.error('非 PocketBase 业务错误:', error); // 在服务端打印详细错误，用于调试
    throw createError({
      statusCode,
      message: defaultMessage, // 返回通用的、对用户无害的错误信息
      statusMessage: 'Internal Error',
      fatal: false, // `fatal: false` 表示这不是一个需要关闭整个服务器的致命错误
    });
  }

  // 至此，我们可以确认 error 是一个 ClientResponseError 实例。
  statusCode = error.status; // 使用 PocketBase 返回的 HTTP 状态码
  const errorData = error.data || {};
  technicalMessage = error.message; // 这是 PocketBase 原始的、未经处理的英文错误信息

  // 步骤 3: 处理针对具体字段的校验错误 (Validation Errors)。
  // PocketBase 在校验失败时，会在 `error.data.data` 中返回一个包含字段错误的详细对象。
  if (errorData.data && typeof errorData.data === 'object') {
    // 提取第一个遇到的字段错误信息，用于在界面上提示。
    const firstFieldError = Object.values(errorData.data)[0] as any;
    if (firstFieldError?.message) {
      // 尝试在我们的中文映射中查找对应的翻译，如果找不到，则直接使用英文原文。
      friendlyMessage = FIELD_ERROR_CODE_MAP[firstFieldError.message] || firstFieldError.message;
    }
  }
  // 步骤 4: 处理全局性的业务逻辑错误。
  else {
    const rawMessage = errorData.message || error.message;
    // 同样，在全局错误映射中查找翻译。
    friendlyMessage = GLOBAL_ERROR_CODE_MAP[rawMessage] || rawMessage;
  }

  // 步骤 5: 构建并抛出最终的、格式化的 H3 错误。
  throw createError({
    statusCode, // HTTP 状态码 (例如 400, 404, 500)
    message: friendlyMessage, // **核心**：给用户看的、友好的中文错误信息。
    statusMessage: technicalMessage.substring(0, 50), // 使用原始英文错误作为 HTTP 状态文本，并截断以防过长
    data: {
      _isPocketBaseError: true, // 附加元数据，表明这是一个来自 PocketBase 的业务错误
      originalError: errorData, // 将原始错误数据一并返回，方便前端进行更复杂的调试或逻辑处理
    },
    // 如果是 5xx 系列的服务端错误，标记为 `fatal`，可能触发更高级别的监控报警。
    fatal: statusCode >= 500,
  });
}

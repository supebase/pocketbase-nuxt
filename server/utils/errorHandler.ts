import { ClientResponseError } from "pocketbase";

/**
 * PocketBase 顶级业务错误码映射
 * 仅用于非字段级的通用错误，例如认证失败
 */
const GLOBAL_ERROR_CODE_MAP: Record<string, string> = {
  "Something went wrong.": "发生错误，请稍后再试。",
  "Failed to authenticate.": "登录失败，请检查电子邮件或密码。",
  "Something went wrong while processing your request.": "处理请求时出错，请稍后再试。",
};

/**
 * PocketBase 字段级校验错误映射
 * PocketBase 字段错误的 message 通常是英文，这里进行本地化映射
 */
const FIELD_ERROR_CODE_MAP: Record<string, string> = {
  "Cannot be blank.": "请填写完整的注册信息",
  "Must be a valid email address.": "请输入有效的电子邮件地址",
  "Must be at least 8 character(s).": "密码至少 8 个字符",
  "Values don't match.": "两次输入的密码不一致",
  "Value must be unique.": "电子邮件已被注册，请更换后重试。",
};

/**
 * PocketBase 通用错误处理器
 * 统一解析 PocketBase 错误并转换为前端可直接展示的友好错误信息
 */
export function handlePocketBaseError(
  error: unknown,
  defaultMessage: string = "服务器处理失败"
): never {
  // 非 PocketBase 错误
  if (!(error instanceof ClientResponseError)) {
    console.error("未知错误:", error);

    throw createError({
      statusCode: 500,
      statusMessage: defaultMessage,
      fatal: true,
    });
  }

  const status = error.status || 500;
  const errorData = error.data || {};

  let friendlyMessage = defaultMessage;

  /**
   * 1. 优先处理字段级校验错误（注册 / 更新资料）
   * data: { email: { message }, password: { message } }
   */
  if (errorData.data && typeof errorData.data === "object") {
    // 提取第一个字段错误
    const firstFieldError = Object.values(errorData.data)[0] as any;

    if (firstFieldError?.message) {
      const pbMessage = firstFieldError.message;
      // 使用映射或直接使用 PocketBase 原始消息
      friendlyMessage = FIELD_ERROR_CODE_MAP[pbMessage] || pbMessage;
    }
  }

  /**
   * 2. 如果没有字段级错误，处理顶级 message（登录失败就在这里）
   */
  if (friendlyMessage === defaultMessage) {
    const errorMessage = errorData.message || error.message;

    if (typeof errorMessage === "string") {
      // 使用映射或直接使用 PocketBase 原始消息
      friendlyMessage = GLOBAL_ERROR_CODE_MAP[errorMessage] || errorMessage;
    }
  }

  console.error(`PocketBase 错误 ${status}:`, {
    url: error.url,
    status,
    data: errorData,
  });

  throw createError({
    statusCode: status,
    statusMessage: friendlyMessage,
    // 添加标记，方便前端识别这是经过处理的错误
    data: {
      _isPocketBaseError: true,
    },
    fatal: status >= 500,
  });
}

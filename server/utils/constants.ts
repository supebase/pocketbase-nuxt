/**
 * PocketBase 全局性、非字段级别的业务错误消息中文映射。
 * 用于将 PocketBase 返回的通用英文错误信息，翻译成更贴近用户的中文提示。
 */
export const GLOBAL_ERROR_CODE_MAP: Record<string, string> = {
	'Something went wrong.': '发生未知错误，请稍后再试。',
	'Failed to authenticate.': '登录认证失败，请检查您的电子邮件或密码是否正确。',
	'Something went wrong while processing your request.': '处理您的请求时出错，请稍后再试。',
	'Failed to create record.': '会话已过期或无效，请重新登录后再操作。',
};

/**
 * PocketBase 特定于数据字段的校验错误消息中文映射。
 * 用于处理表单提交时，后端返回的针对具体字段（如 email, password）的验证失败信息。
 */
export const FIELD_ERROR_CODE_MAP: Record<string, string> = {
	'Cannot be blank.': '此为必填项，内容不能为空。',
	'Must be a valid email address.': '请输入一个有效的电子邮件地址。',
	'Must be at least 8 character(s).': '密码长度至少需要 8 个字符。',
	"Values don't match.": '您两次输入的密码不一致，请检查。',
	'Value must be unique.': '该电子邮件地址已被注册，请更换后重试。',
};
/**
 * @file 服务端统一错误处理器 (增强版)
 * @description 处理 PocketBase 错误，支持多字段校验错误汇总，并将详细错误结构传递至前端。
 */
import { ClientResponseError } from 'pocketbase';
import { GLOBAL_ERROR_CODE_MAP, FIELD_ERROR_CODE_MAP } from './constants';

/**
 * PocketBase 通用错误处理函数。
 * @param error 捕获到的错误对象。
 * @param defaultMessage 兜底的中文提示。
 */
export function handlePocketBaseError(error: unknown, defaultMessage: string = '请求失败，请稍后再试'): never {
	let friendlyMessage = defaultMessage;
	let statusCode = 500;
	let technicalMessage = 'Internal Server Error';

	// 1. 网络层错误处理 (服务不可用或连接超时)
	const isNetworkError =
		(error instanceof TypeError && error.message === 'Failed to fetch') ||
		(error instanceof ClientResponseError && error.status === 0);

	if (isNetworkError) {
		throw createError({
			statusCode: 503,
			message: '无法连接到后端服务，请检查网络或稍后重试。',
			statusMessage: 'Service Unavailable',
			data: { _isNetworkError: true },
		});
	}

	// 2. 非 PocketBase 产生的代码逻辑错误
	if (!(error instanceof ClientResponseError)) {
		console.error('[Internal Error]:', error);
		throw createError({
			statusCode,
			message: defaultMessage,
			statusMessage: 'Internal System Error',
			fatal: false,
		});
	}

	// 3. 解析 PocketBase 标准错误
	statusCode = error.status;
	const errorData = error.data || {};
	technicalMessage = error.message;

	// 4. 处理多字段校验错误 (Validation Errors)
	// 逻辑：提取所有字段的错误信息，并进行中文映射，最后通过分号连接
	if (errorData.data && typeof errorData.data === 'object' && Object.keys(errorData.data).length > 0) {
		const errorEntries = Object.entries(errorData.data);

		const translatedMessages = errorEntries.map(([field, details]: [string, any]) => {
			const rawFieldMsg = details?.message || '格式错误';
			// 尝试翻译具体错误信息
			return FIELD_ERROR_CODE_MAP[rawFieldMsg] || rawFieldMsg;
		});

		// 使用 Set 去重（例如多个字段都报“不能为空”时，汇总显示更简洁）
		const uniqueMessages = Array.from(new Set(translatedMessages));

		// 如果有多个错误，合并显示；如果只有一个，直接显示
		friendlyMessage = uniqueMessages.length > 1
			? uniqueMessages.join('；')
			: uniqueMessages[0];
	}
	// 5. 处理全局业务逻辑错误 (例如：404 找不到、403 权限不足)
	else {
		const rawMessage = errorData.message || error.message;
		friendlyMessage = GLOBAL_ERROR_CODE_MAP[rawMessage] || rawMessage;
	}

	// 6. 抛出格式化的 H3 错误
	throw createError({
		statusCode,
		message: friendlyMessage,
		statusMessage: technicalMessage.substring(0, 50),
		data: {
			_isPocketBaseError: true,
			// 💡 关键：将完整的原始错误结构返回，方便前端做字段高亮
			fields: errorData.data || {},
			originalMessage: technicalMessage
		},
		fatal: statusCode >= 500,
	});
}
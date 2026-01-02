/**
 * @file 服务端统一错误处理器
 * @description 该文件负责集中处理与 PocketBase 交互时可能发生的各类错误，
 *              将其转换为对前端友好、易于理解的标准化错误响应。
 */
import { ClientResponseError } from 'pocketbase';
import { GLOBAL_ERROR_CODE_MAP, FIELD_ERROR_CODE_MAP } from './constants';

/**
 * PocketBase 通用错误处理函数 (优化版)。
 * 捕获未知类型的错误，并尝试将其解析为结构化的 HTTP 错误响应。
 * @param error 捕获到的未知错误对象。
 * @param defaultMessage 如果无法从错误中解析出具体信息，则使用此默认的中文提示。
 * @returns 该函数从不 "返回"，而是总是通过 `throw createError` 抛出一个 H3 错误，中断当前执行并触发 Nitro 的错误处理流程。
 */
export function handlePocketBaseError(error: unknown, defaultMessage: string = '请求失败，请稍后再试'): never {
	let friendlyMessage = defaultMessage;
	let statusCode = 500;
	let technicalMessage = 'Internal Server Error';

	// 步骤 1: 优先处理网络层面的错误。
	// 这种错误通常发生在无法连接到 PocketBase 服务时（例如，服务宕机、网络不通）。
	const isNetworkError =
		(error instanceof TypeError && error.message === 'Failed to fetch') ||
		(error instanceof ClientResponseError && error.status === 0);

	if (isNetworkError) {
		// 抛出一个 503 Service Unavailable 错误，明确告知前端问题出在服务端连接上。
		throw createError({
			statusCode: 503,
			message: '无法连接到后端服务，请检查您的网络或稍后重试。',
			statusMessage: 'Service Unavailable',
			data: { _isNetworkError: true },
		});
	}

	// 步骤 2: 确认错误是来自 PocketBase 的标准错误类型。
	if (!(error instanceof ClientResponseError)) {
		// 如果错误不是 ClientResponseError，说明可能是代码中的其他逻辑错误。
		console.error('非 PocketBase 业务错误:', error);
		throw createError({
			statusCode,
			message: defaultMessage,
			statusMessage: 'Internal Error',
			fatal: false,
		});
	}

	// 至此，我们可以确认 error 是一个 ClientResponseError 实例。
	statusCode = error.status;
	const errorData = error.data || {};
	technicalMessage = error.message;

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
		statusCode,
		message: friendlyMessage,
		statusMessage: technicalMessage.substring(0, 50),
		data: {
			_isPocketBaseError: true,
			originalError: errorData,
		},
		// 如果是 5xx 系列的服务端错误，标记为 `fatal`，可能触发更高级别的监控报警。
		fatal: statusCode >= 500,
	});
}

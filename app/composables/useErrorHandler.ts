import type { ClientResponseError } from "pocketbase";
import type { ApiError } from "~/types/user";

/**
 * 错误处理 Composable
 */
export const useErrorHandler = () => {
    /**
     * 处理 PocketBase 客户端响应错误
     * @param error 客户端响应错误
     * @param defaultMessage 默认错误消息
     * @returns 格式化后的错误对象
     */
    const handlePbError = (error: ClientResponseError, defaultMessage: string): ApiError => {
        // 检查是否是 PocketBase 返回的结构化验证错误 (400 Bad Request)
        if (error.status === 400 && error.response?.data) {
            return {
                isError: true,
                message: defaultMessage,
                errors: error.response.data as ApiError["errors"],
            };
        }

        // 捕获其他 PocketBase 错误（如 500 服务器错误或网络问题）
        return {
            isError: true,
            message: error.message || defaultMessage,
        };
    };

    /**
     * 处理通用错误
     * @param error 错误对象
     * @param defaultMessage 默认错误消息
     * @returns 格式化后的错误对象
     */
    const handleGenericError = (error: unknown, defaultMessage: string): ApiError => {
        if (error instanceof Error) {
            return {
                isError: true,
                message: error.message || defaultMessage,
            };
        }

        // 处理非 Error 类型的错误
        return {
            isError: true,
            message: defaultMessage,
        };
    };

    /**
     * 格式化错误消息，用于显示给用户
     * @param error 错误对象
     * @returns 格式化后的错误消息
     */
    const formatErrorMessage = (error: ApiError): string => {
        if (error.errors) {
            // 结构化验证错误，组合成完整的错误信息
            let combinedErrorMessage = `${error.message}\n`;
            const fieldOrder = ["email", "password", "passwordConfirm", "avatar"];
            
            // 按字段顺序显示错误
            fieldOrder.forEach((key) => {
                const fieldError = error.errors?.[key];
                if (fieldError) {
                    combinedErrorMessage += `- ${key}: [${fieldError.code}] ${fieldError.message}\n`;
                }
            });
            
            // 显示其他未列出的错误字段
            for (const key in error.errors) {
                if (!fieldOrder.includes(key)) {
                    const fieldError = error.errors[key];
                    if (fieldError) {
                        combinedErrorMessage += `- ${key}: [${fieldError.code}] ${fieldError.message}\n`;
                    }
                }
            }
            
            return combinedErrorMessage.trim();
        }

        // 通用错误，直接返回消息
        return error.message;
    };

    return {
        handlePbError,
        handleGenericError,
        formatErrorMessage,
    };
};
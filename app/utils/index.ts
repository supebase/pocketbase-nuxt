/**
 * 清理 Markdown 语法，返回纯文本
 * @param text - 包含 Markdown 语法的文本
 * @returns 清理后的纯文本
 */

const markdownCache = new Map<string, string>();
const MAX_CACHE_SIZE = 500;

export function cleanMarkdown(text: string): string {
	if (typeof text !== 'string' || !text) return '';

	// 1. 检查缓存
	if (markdownCache.has(text)) {
		return markdownCache.get(text)!;
	}

	const cleaned = text
		// 移除图片 (包括带描述的)
		.replace(/!\[.*?\]\(.*?\)/g, '')
		// 移除代码块
		.replace(/```[\s\S]*?```/g, '')
		// 链接处理：修正了 [文字](链接) 的正则，防止非贪婪模式失效
		.replace(/\[([^\]]+)\]\([^)]+\)(?:\{target=_blank\})?/g, '$1')
		// 标题、加粗、斜体等
		.replace(/#{1,6}\s/g, '')
		.replace(/\*\*(.+?)\*\*/g, '$1')
		.replace(/\*(.+?)\*/g, '$1')
		.replace(/~~(.+?)~~/g, '$1')
		.replace(/`(.+?)`/g, '$1')
		// 引用和列表
		.replace(/^>\s+/gm, '') // 修正：使用多行模式匹配行首的 >
		.replace(/^\s*[-*+]\s+/gm, '')
		.replace(/^\s*\d+\.\s+/gm, '')
		// 仅移除 iframe
		.replace(/<iframe[^>]*>.*?<\/iframe>/gis, '')
		.replace(/<iframe[^>]*\/?>/gi, '')
		// MDC 组件语法清理 (::component)
		.replace(/::.*?::/gs, '')
		// 移除多余换行，合并为空格或单换行
		.replace(/\n+/g, ' ')
		// 水平分割线
		.replace(/^\s*[-*_]{3,}\s*$/gm, '')
		.trim();

	// 2. 写入缓存并限制大小
	if (markdownCache.size > MAX_CACHE_SIZE) {
		const firstKey = markdownCache.keys().next().value;
		markdownCache.delete(firstKey || '');
	}
	markdownCache.set(text, cleaned);

	return cleaned;
}

/**
 * 从 Markdown 字符串中提取第一张图片的 URL
 */
export const getFirstImageUrl = (content: string): string | null => {
	if (!content) return null;

	// 1. 匹配标准 Markdown 图片语法: ![alt](url)
	const mdImageRegex = /!\[.*?\]\((.*?)\)/;
	const mdMatch = content.match(mdImageRegex);
	if (mdMatch && mdMatch[1]) {
		return mdMatch[1];
	}

	// 2. 备选：匹配 HTML img 标签: <img src="url">
	const htmlImageRegex = /<img.*?src=["'](.*?)["']/;
	const htmlMatch = content.match(htmlImageRegex);
	if (htmlMatch && htmlMatch[1]) {
		return htmlMatch[1];
	}

	return null;
};

/**
 * 格式化用户名：首字母大写，其余小写
 */
export function formatDefaultName(name: string): string {
	if (!name) return '';
	// 确保先转小写，再把首字母提出来大写
	const lower = name.toLowerCase();
	return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * 预处理邮箱：去空格并转小写
 */
export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

/**
 * 格式化 IP 显示
 * 示例: 112.112.112.112 -> 112.112.*.*
 */
export const formatLocation = (location: string) => {
	if (!location) return '未知 IP';

	// 匹配 IPv4 的正则
	const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;

	if (ipv4Regex.test(location)) {
		const segments = location.split('.');
		return ` ${segments[0]}.${segments[1]}.*.*`;
	}

	return location;
};

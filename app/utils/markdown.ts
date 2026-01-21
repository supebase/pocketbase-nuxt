/**
 * 清理 Markdown 语法，返回纯文本
 * @param text - 包含 Markdown 语法的文本
 * @returns 清理后的纯文本
 */
import { MAX_CACHE_SIZE } from '~/constants';
import { MARKDOWN_CLEAN_RULES } from '~/constants/markdown';

const markdownCache = new Map<string, string>();

export function cleanMarkdown(text: string): string {
  if (typeof text !== 'string' || !text) return '';

  if (markdownCache.has(text)) {
    return markdownCache.get(text)!;
  }

  // 2. 行为与数据分离：使用 reduce 应用规则
  const cleaned = MARKDOWN_CLEAN_RULES.reduce((acc, rule) => {
    return acc.replace(rule.pattern, rule.replacement);
  }, text).trim();

  // 3. 缓存管理 (建议抽离成独立函数)
  manageCache(text, cleaned);

  return cleaned;
}

function manageCache(key: string, value: string) {
  if (markdownCache.size >= MAX_CACHE_SIZE) {
    const firstKey = markdownCache.keys().next().value;
    if (firstKey) markdownCache.delete(firstKey);
  }
  markdownCache.set(key, value);
}

/**
 * 从 Markdown 字符串中提取第一张图片的 URL
 * 1. 健壮性：增加正则命名捕获组 (?<url>...)，代码意图更清晰。
 * 2. 准确性：通过 [^\s)] 排除掉图片 title (如 "my title") 的干扰。
 * 3. 容错性：增加 HTML 忽略大小写匹配 (i)，并先移除代码块内容防止误抓。
 */
export const getFirstImageUrl = (content: string): string | null => {
  if (typeof content !== 'string' || !content.trim()) return null;

  // 1. 预处理：移除代码块内容 (```...``` 和 `...`)，防止抓取到示例代码中的图片链接
  const cleanContent = content.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*?`/g, '');

  // 2. 匹配标准 Markdown 图片: ![alt](url "title")
  // 排除掉 URL 里的空格和右括号，支持可选的 title
  const mdImageRegex = /!\[.*?\]\((?<url>[^\s)]+)(?:\s+["'].*?["'])?\)/;
  const mdMatch = cleanContent.match(mdImageRegex);
  // 增加协议验证
  if (mdMatch?.groups?.url) {
    const url = mdMatch.groups.url;
    // 仅允许合法链接，过滤 data: (过大) 或 javascript: (危险)
    if (url.startsWith('http') || url.startsWith('/')) return url;
  }

  // 3. 备选：匹配 HTML img 标签: <img src="url">
  // 增加 i 标志以支持 <IMG SRC="...">，并适配更多属性
  const htmlImageRegex = /<img[^>]+src=["'](?<url>.*?)["']/i;
  const htmlMatch = cleanContent.match(htmlImageRegex);
  if (htmlMatch?.groups?.url) {
    return htmlMatch.groups.url;
  }

  return null;
};

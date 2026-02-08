/**
 * @file Markdown Utils
 * @description 提供 Markdown 清理与提取功能，内置带 TTL 的内存缓存机制。
 */
import { MAX_CACHE_SIZE } from '~/constants';
import { MARKDOWN_CLEAN_RULES, CACHE_TTL } from '~/constants/markdown';
import type { CacheEntry } from '~/types';

// 缓存配置
const markdownCache = new Map<string, CacheEntry>();

/**
 * 清理 Markdown 语法，返回纯文本
 * @param text - 包含 Markdown 语法的文本
 * @returns 清理后的纯文本
 */
export function cleanMarkdown(text: string): string {
  if (typeof text !== 'string' || !text) return '';

  const now = Date.now();
  const cached = markdownCache.get(text);

  // 1. 命中缓存且未过期
  if (cached && now < cached.expiry) {
    return cached.value;
  }

  // 2. 逻辑处理：应用正则规则
  const cleaned = MARKDOWN_CLEAN_RULES.reduce((acc, rule) => {
    return acc.replace(rule.pattern, rule.replacement);
  }, text).trim();

  // 3. 更新缓存
  manageCache(text, cleaned, now + CACHE_TTL);

  return cleaned;
}

/**
 * 缓存管理（支持容量限制与过期检查）
 */
function manageCache(key: string, value: string, expiry: number) {
  // 1. 如果超过最大容量，删除最早插入的条目 (FIFO)
  if (markdownCache.size >= MAX_CACHE_SIZE) {
    const firstKey = markdownCache.keys().next().value;
    if (firstKey) markdownCache.delete(firstKey);
  }

  // 2. 概率性清理过期条目 (防止某些 key 长期不被访问导致内存无法释放)
  // 设定 1% 的触发概率
  if (Math.random() < 0.01) {
    const now = Date.now();
    for (const [k, entry] of markdownCache.entries()) {
      if (now >= entry.expiry) markdownCache.delete(k);
    }
  }

  markdownCache.set(key, { value, expiry });
}

/**
 * 从 Markdown 字符串中提取第一张图片的 URL
 */
export const getFirstImageUrl = (content: string): string | null => {
  if (typeof content !== 'string' || !content.trim()) return null;

  // 1. 预处理：移除代码块（防止匹配到示例代码中的图片链接）
  const cleanContent = content.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*?`/g, '');

  // 2. 增强版 Markdown 图片正则
  // 逻辑：匹配 ![...] 后面跟着 ( )。
  // 括号内第一部分是非空白字符（URL），后面可选跟随空格和带引号的标题
  const mdImageRegex = /!\[.*?\]\(\s*(?<url>[^\s)]+)(\s+["'].*?["'])?\s*\)/;
  const mdMatch = cleanContent.match(mdImageRegex);

  if (mdMatch?.groups?.url) {
    const url = mdMatch.groups.url;
    // 💡 验证 URL 是否合理：允许 http, https, / 开头，排除数据流 data:
    if (/^(https?:\/\/|\/|\.\/)/i.test(url)) return url;
  }

  // 3. 备选：匹配 HTML img 标签
  const htmlImageRegex = /<img[^>]+src\s*=\s*["'](?<url>[^"']+)["']/i;
  const htmlMatch = cleanContent.match(htmlImageRegex);

  if (htmlMatch?.groups?.url) {
    const url = htmlMatch.groups.url;
    if (/^(https?:\/\/|\/|\.\/)/i.test(url)) return url;
  }

  return null;
};

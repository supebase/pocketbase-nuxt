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

  // 1. 预处理：移除代码块
  const cleanContent = content.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*?`/g, '');

  // 2. 匹配标准 Markdown 图片
  const mdImageRegex = /!\[.*?\]\((?<url>[^\s)]+)(?:\s+["'].*?["'])?\)/;
  const mdMatch = cleanContent.match(mdImageRegex);

  if (mdMatch?.groups?.url) {
    const url = mdMatch.groups.url;
    // 过滤 data: 等非法或过大链接
    if (url.startsWith('http') || url.startsWith('/')) return url;
  }

  // 3. 备选：匹配 HTML img
  const htmlImageRegex = /<img[^>]+src=["'](?<url>.*?)["']/i;
  const htmlMatch = cleanContent.match(htmlImageRegex);

  if (htmlMatch?.groups?.url) {
    const url = htmlMatch.groups.url;
    if (url.startsWith('http') || url.startsWith('/')) return url;
  }

  return null;
};

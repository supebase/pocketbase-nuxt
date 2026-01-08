/**
 * 提取 Markdown 中的外部远程图片并下载 (并发限制安全版)
 */
import pLimit from 'p-limit';
import { MD_IMAGE_MAX_SIZE } from '~/constants/index';

export const processMarkdownImages = async (content: string) => {
  // 设置并发限制：例如最多同时下载 3 张图片
  const limit = pLimit(3);
  const imageRegex = /!\[.*?\]\((https?:\/\/(?!.*\/api\/)[^)]+)\)/gi;
  const matches = [...content.matchAll(imageRegex)];

  const seen = new Set<string>();

  // 1. 预处理任务列表
  const tasks = matches.map((match) => {
    const url = match[1];

    if (seen.has(url) || url.includes('/api/images/')) return null;
    seen.add(url);

    // 2. 使用 limit 包装下载逻辑
    return limit(async () => {
      try {
        const response = await $fetch.raw<ArrayBuffer>(url, {
          responseType: 'arrayBuffer',
          timeout: 8000,
          onResponse({ response }) {
            const contentLength = response.headers.get('content-length');
            if (contentLength && parseInt(contentLength) > MD_IMAGE_MAX_SIZE) {
              throw new Error('FILE_TOO_LARGE');
            }
          },
        });

        if (!response._data || response._data.byteLength > MD_IMAGE_MAX_SIZE) {
          return null;
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.startsWith('image/')) return null;

        const blob = new Blob([response._data], { type: contentType });
        return { url, blob };
      } catch (e: any) {
        if (e.message === 'FILE_TOO_LARGE') {
          console.warn(`[Markdown Image] 跳过超大图片: ${url}`);
        } else {
          console.error(`[Markdown Image] 下载失败: ${url}`, e.message);
        }
        return null;
      }
    });
  });

  // 3. 过滤掉 null 任务并执行
  const activeTasks = tasks.filter(
    (t): t is Promise<{ url: string; blob: Blob } | null> => t !== null,
  );
  const results = await Promise.all(activeTasks);

  const successResults = results.filter((r): r is { url: string; blob: Blob } => r !== null);
  const skippedCount = matches.length - successResults.length;

  return { successResults, skippedCount };
};

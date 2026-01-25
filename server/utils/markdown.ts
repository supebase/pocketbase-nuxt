/**
 * @file Markdown Image Processor
 * @description 解析 Markdown 中的远程图片链接，并执行受限并发的异步下载任务。
 */

import pLimit from 'p-limit';
import { DEFAULT_IMAGE_CONCURRENCY, IMAGE_DOWNLOAD_TIMEOUT, MD_IMAGE_MAX_SIZE } from '~/constants/index';

/**
 * 提取并下载 Markdown 远程图片
 * @description 核心特性：正则表达式过滤 -> 任务预处理 -> 并发池控制 -> 尺寸 & 类型校验
 * @returns { successResults, skippedCount } 下载成功的 Blob 对象列表及跳过的数量
 */
export const processMarkdownImages = async (
  content: string,
): Promise<{ successResults: { url: string; blob: Blob }[]; skippedCount: number }> => {
  // 初始化并发控制器（防止 OOM 内存溢出）
  const limit = pLimit(DEFAULT_IMAGE_CONCURRENCY);
  const imageRegex = /!\[.*?\]\((https?:\/\/(?!.*\/api\/)[^)]+)\)/gi;
  const matches = [...content.matchAll(imageRegex)];

  const seen = new Set<string>();

  // 构造下载任务序列
  const tasks = matches.map((match) => {
    const url = match[1] || '';

    // 过滤重复链接或已本地化的内部链接
    if (seen.has(url) || url.includes('/api/images/')) return null;
    seen.add(url);

    // 执行受限并发的下载逻辑
    return limit(async () => {
      try {
        const head = await $fetch.raw(url, { method: 'HEAD', timeout: 1000 }).catch(() => null);
        const size = head?.headers.get('content-length');
        if (size && parseInt(size) > MD_IMAGE_MAX_SIZE) return null;

        const response = await $fetch.raw<ArrayBuffer>(url, {
          responseType: 'arrayBuffer',
          timeout: IMAGE_DOWNLOAD_TIMEOUT,
          // 早期拦截：检查响应头 Content-Length，避免下载超大文件
          onResponse({ response }) {
            const contentLength = response.headers.get('content-length');
            if (contentLength && parseInt(contentLength) > MD_IMAGE_MAX_SIZE) {
              throw new Error('FILE_TOO_LARGE');
            }
          },
        });

        // 校验：内容大小及 MIME 类型
        if (!response._data || response._data.byteLength > MD_IMAGE_MAX_SIZE) return null;
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.startsWith('image/')) return null;

        // 封装为标准 Blob 对象
        const blob = new Blob([response._data], { type: contentType });
        return { url, blob };
      } catch (e: any) {
        if (e.message === 'FILE_TOO_LARGE') {
          console.warn(`[Image Sync] 跳过超大文件: ${url}`);
        } else {
          // console.error(`[Image Sync] 下载异常: ${url}`, e.message);
        }
        return null;
      }
    });
  });

  // 并行执行所有受限任务并清洗结果
  const activeTasks = tasks.filter((t): t is Promise<{ url: string; blob: Blob } | null> => t !== null);

  const results = await Promise.all(activeTasks);
  const successResults = results.filter((r): r is { url: string; blob: Blob } => r !== null);

  return {
    successResults,
    skippedCount: matches.length - successResults.length,
  };
};

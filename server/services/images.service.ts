/**
 * @file Image Sync Service
 * @description 专门用于解析 Markdown 内容，自动下载其中的远程图片并转存至 PocketBase 存储。
 */

import { syncMarkdownContent } from '~~/server/utils/markdown-sync';
import type { SyncOptions } from '~/types/server';

/**
 * 同步 Markdown 远程图片
 * @description 核心逻辑：提取 URL -> 下载 Blob -> FormData 提交 -> 替换 Markdown 链接
 * @returns 替换为 PocketBase 本地存储路径后的新 Markdown 内容
 */
export async function performMarkdownImageSync({
  pb,
  collection,
  recordId,
  content,
  existingImages = [],
}: SyncOptions): Promise<string> {
  // 快速跳过：无远程图片链接时直接返回
  if (!content.includes('http')) {
    return content;
  }

  try {
    return await syncMarkdownContent(content, recordId, async (newItems) => {
      // 如果没有新图片需要下载（可能全是本地路径或下载失败），直接返回空数组
      if (newItems.length === 0) return [];

      const formData = new FormData();

      // 1. 核心：保留旧图片（PocketBase 要求重新提交旧文件名以防止被删除）
      if (Array.isArray(existingImages)) {
        existingImages.forEach((name) => formData.append('markdown_images', name));
      }

      // 2. 添加新下载的图片
      newItems.forEach((item) => {
        // 确保 blob 存在且合法
        if (item.blob) {
          formData.append('markdown_images', item.blob, item.fileName);
        }
      });

      // 3. 提交更新
      const record = await pb.collection(collection).update(recordId, formData);

      // 4. 返回新生成的文件名列表
      // PB 会将新上传的文件追加入数组，我们只需提取最后 N 个
      const allImages = (record.markdown_images || []) as string[];
      return allImages.slice(-newItems.length);
    });
  } catch (error) {
    console.error('[ImageSync] 过程中出现异常:', error);

    // 失败时回退到原始内容，保证文章能存下来
    return content;
  }
}

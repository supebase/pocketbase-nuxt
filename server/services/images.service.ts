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

  return await syncMarkdownContent(content, recordId, async (newItems) => {
    const formData = new FormData();

    // 保持持久化：必须将已存在的旧文件名重新 append，否则 PB 默认会将其删除
    existingImages.forEach((name) => formData.append('markdown_images', name));

    // 批量添加新图片文件
    newItems.forEach((item) => {
      formData.append('markdown_images', item.blob, item.fileName);
    });

    // 执行更新：将文件上传至对应集合记录
    const record = await pb.collection(collection).update(recordId, formData);

    // 映射结果：PB 会将新上传的文件追加在数组末尾，截取新生成的文件名返回给 syncMarkdownContent
    return (record.markdown_images as string[]).slice(-newItems.length);
  });
}

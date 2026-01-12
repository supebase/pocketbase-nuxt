import { syncMarkdownContent } from '~~/server/utils/markdown-sync';
import type { TypedPocketBase } from '~/types/pocketbase-types';

interface SyncOptions {
  pb: TypedPocketBase;
  collection: 'posts';
  recordId: string;
  content: string;
  existingImages?: string[];
}

/**
 * 同步 Markdown 中的远程图片到指定的 PB 集合
 */
export async function performMarkdownImageSync({
  pb,
  collection,
  recordId,
  content,
  existingImages = [],
}: SyncOptions): Promise<string> {
  // 如果内容根本没包含 http，直接返回，节省资源
  if (!content.includes('http')) {
    return content;
  }

  return await syncMarkdownContent(content, recordId, async (newItems) => {
    const formData = new FormData();

    // 1. 关键：必须传回旧文件名列表，否则 PB 会删除旧文件
    existingImages.forEach((name) => formData.append('markdown_images', name));

    // 2. 添加新文件
    newItems.forEach((item) => {
      formData.append('markdown_images', item.blob, item.fileName);
    });

    // 3. 提交到 PB 并获取更新后的记录
    const record = await pb.collection(collection).update(recordId, formData);

    // 4. 返回 PB 生成的最新文件名数组中对应新上传的部分
    // PB 会将新文件追加在数组末尾
    return (record.markdown_images as string[]).slice(-newItems.length);
  });
}

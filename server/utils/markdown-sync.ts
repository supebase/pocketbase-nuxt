import { processMarkdownImages } from './markdown';

export async function syncMarkdownContent(
  content: string,
  postId: string,
  onNewImages: (blobs: { blob: Blob; fileName: string }[]) => Promise<string[]>,
) {
  const { successResults, skippedCount } = await processMarkdownImages(content);

  let finalContent = content;

  if (successResults.length > 0) {
    // 将 Blob 交给回调函数（通常是数据库更新），获取存入后的文件名
    const newFileNames = await onNewImages(
      successResults.map((item, i) => ({
        blob: item.blob,
        fileName: `img_${Date.now()}_${i}.png`,
      })),
    );

    // 替换 URL
    successResults.forEach((item, i) => {
      const fileName = newFileNames[i];
      const proxyUrl = `/api/images/posts/${postId}/${fileName}`;
      finalContent = finalContent.split(item.url).join(proxyUrl);
    });
  }

  // 追加警告信息
  if (skippedCount > 0 && !finalContent.includes('部分远程图片因体积过大')) {
    finalContent += `\n\n> ⚠️ **提示**: 部分远程图片因体积过大未同步到本地。`;
  }

  return finalContent;
}

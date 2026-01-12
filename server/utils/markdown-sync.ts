import { processMarkdownImages } from './markdown';

export async function syncMarkdownContent(
  content: string,
  postId: string,
  onNewImages: (blobs: { blob: Blob; fileName: string }[]) => Promise<string[]>,
) {
  const { successResults, skippedCount } = await processMarkdownImages(content);

  let finalContent = content;

  if (successResults.length > 0) {
    const newFileNames = await onNewImages(
      successResults.map((item, i) => ({
        blob: item.blob,
        fileName: `img_${Date.now()}_${i}.png`,
      })),
    );

    // 替换原始 URL 为本地代理 URL
    successResults.forEach((item, i) => {
      const fileName = newFileNames[i];
      const proxyUrl = `/api/images/posts/${postId}/${fileName}`;
      finalContent = finalContent.split(item.url).join(proxyUrl);
    });
  }

  // 注入警告信息（仅在包含跳过的图片且未曾注入过时）
  if (skippedCount > 0 && !finalContent.includes('部分远程图片因体积过大')) {
    finalContent += `\n\n> ⚠️ **提示**: 部分远程图片因体积过大未同步到本地。`;
  }

  return finalContent;
}

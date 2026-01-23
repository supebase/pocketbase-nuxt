/**
 * @file Markdown Sync Utility
 * @description 协调 Markdown 内容中的图片下载、存储与链接替换逻辑。
 */

/**
 * 同步 Markdown 内容
 * @description 流程：并发下载图片 -> 执行存储回调 -> 替换 Markdown 链接 -> 注入状态提示
 * @param content - 原始 Markdown 文本
 * @param postId - 文章/记录 ID，用于构造访问路径
 * @param onNewImages - 存储操作的回调函数，负责将 Blob 保存至服务器并返回文件名
 */
export async function syncMarkdownContent(
  content: string,
  postId: string,
  onNewImages: (blobs: { blob: Blob; fileName: string }[]) => Promise<string[]>,
) {
  // 执行并发下载任务
  const { successResults, skippedCount } = await processMarkdownImages(content);

  let finalContent = content;

  // 处理下载成功的图片
  if (successResults.length > 0) {
    // 调用外部传入的存储逻辑（如写入 PocketBase）
    const newFileNames = await onNewImages(
      successResults.map((item, i) => ({
        blob: item.blob,
        fileName: `img_${Date.now()}_${i}.png`,
      })),
    );

    // 链接重写：将远程 URL 全量替换为本地代理路径
    successResults.forEach((item, i) => {
      const fileName = newFileNames[i];
      const proxyUrl = `/api/images/posts/${postId}/${fileName}`;

      // 使用 split/join 确保内容中多次出现的同一链接被全部替换
      finalContent = finalContent.split(item.url).join(proxyUrl);
    });
  }

  // 用户反馈：若存在因超限跳过的图片，在文末追加提示
  const skipWarning = '⚠️ **提示**: 部分远程图片因体积过大未同步到本地。';
  if (skippedCount > 0 && !finalContent.includes(skipWarning)) {
    finalContent += `\n\n> ${skipWarning}`;
  }

  return finalContent;
}

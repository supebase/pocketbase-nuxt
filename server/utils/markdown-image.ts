/**
 * 提取 Markdown 中的外部远程图片并下载
 */
export const processMarkdownImages = async (content: string) => {
  const imageRegex = /!\[.*?\]\((https?:\/\/.*?)\)/g;
  const matches = [...content.matchAll(imageRegex)];

  const blobs: Blob[] = [];
  const remoteUrls: string[] = [];
  const seen = new Set<string>();

  for (const match of matches) {
    const url = match[1];

    // 1. 去重判断
    if (seen.has(url)) continue;

    // 2. 核心：判断是否已经是本地化后的图片
    // 逻辑：如果链接里包含 '/api/images/'，说明它已经是存储在 PB 里的文件了，跳过下载
    if (url.includes('/api/images/')) {
      continue;
    }

    seen.add(url);

    try {
      // 3. 只下载真正的外部链接
      const buffer = await $fetch<ArrayBuffer>(url, {
        responseType: 'arrayBuffer',
        timeout: 8000,
      });

      const ext = url.split('.').pop()?.split(/[?#]/)[0] || 'png';
      const blob = new Blob([buffer], { type: `image/${ext}` });

      blobs.push(blob);
      remoteUrls.push(url);
    } catch (e) {
      console.error(`[Markdown Image] 外部图片下载失败: ${url}`);
    }
  }

  return { blobs, remoteUrls };
};

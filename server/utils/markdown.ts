/**
 * 提取 Markdown 中的外部远程图片并下载 (高效并行版)
 */
export const processMarkdownImages = async (content: string) => {
  const imageRegex = /!\[.*?\]\((https?:\/\/.*?)\)/g;
  const matches = [...content.matchAll(imageRegex)];

  const tasks: Promise<{ url: string; blob: Blob } | null>[] = [];
  const seen = new Set<string>();

  for (const match of matches) {
    const url = match[1];

    // 1. 去重及本地路径判断
    if (seen.has(url) || url.includes('/api/images/')) continue;
    seen.add(url);

    // 2. 创建下载任务 (暂不 await)
    tasks.push(
      (async () => {
        try {
          const response = await $fetch.raw<ArrayBuffer>(url, {
            responseType: 'arrayBuffer',
            timeout: 8000,
          });

          const contentType = response.headers.get('content-type') || '';
          if (!contentType.startsWith('image/')) {
            return null;
          }

          const blob = new Blob([response._data!], { type: contentType });
          return { url, blob };
        } catch (e) {
          console.error(`[Markdown Image] 下载失败: ${url}`);
          return null;
        }
      })(),
    );
  }

  // 3. 并行执行所有任务
  const results = await Promise.all(tasks);

  // 4. 过滤掉失败的任务 (null)
  const successResults = results.filter((r): r is { url: string; blob: Blob } => r !== null);

  return { successResults };
};

import fs from 'node:fs';
import path from 'node:path';
import { hash } from 'ohash';

/**
 * 并发处理 Markdown 内容中的远程图片并本地化
 */
export const processMarkdownImages = async (content: string): Promise<string> => {
  if (!content) return content;

  // 正则匹配: ![alt](url)
  const imageRegex = /!\[(.*?)\]\((https?:\/\/.*?)\)/g;
  const matches = [...content.matchAll(imageRegex)];

  if (matches.length === 0) return content;

  // 统一使用项目根目录下的 public 目录
  // process.cwd() 在你的 PM2 配置下即为 /root
  const baseDir = path.join(process.cwd(), 'public');
  // 使用 Map 存储 URL 到本地路径的映射，避免同一篇文章中重复的 URL 多次下载
  const urlMap = new Map<string, string>();

  // 并发执行下载任务
  await Promise.all(
    matches.map(async (match) => {
      const [_, alt, imageUrl] = match;

      // 如果已经在处理列表中则跳过
      if (urlMap.has(imageUrl)) return;

      try {
        const fileHash = hash(imageUrl);
        // 提取后缀名，处理带参数的 URL (如 .jpg?v=1)
        const extension = imageUrl.split('.').pop()?.split(/[?#]/)[0] || 'png';
        const fileName = `${fileHash}.${extension}`;

        const uploadDir = path.join(baseDir, 'uploads');
        const filePath = path.join(uploadDir, fileName);

        // 统一返回接口路径
        const publicUrl = `/api/images/uploads/${fileName}`;

        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        // 如果本地不存在则执行下载
        if (!fs.existsSync(filePath)) {
          const buffer = await $fetch<ArrayBuffer>(imageUrl, {
            responseType: 'arrayBuffer',
            timeout: 8000,
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
          });
          fs.writeFileSync(filePath, Buffer.from(buffer));
        }

        urlMap.set(imageUrl, publicUrl);
      } catch (error) {
        console.error(`[MarkdownImage] 下载失败: ${imageUrl}`, error);
      }
    })
  );

  // 统一替换内容
  let newContent = content;
  urlMap.forEach((localUrl, remoteUrl) => {
    // 替换所有匹配的远程 URL
    newContent = newContent.split(remoteUrl).join(localUrl);
  });

  return newContent;
};

import ogs from 'open-graph-scraper';
import { hash } from 'ohash';
import fs from 'node:fs';
import path from 'node:path';

// 统一使用项目根目录下的 public 目录
// process.cwd() 在你的 PM2 配置下即为 /root
const baseDir = path.join(process.cwd(), 'public');

const ensureAbsoluteUrl = (pathStr: string | undefined, baseUrl: string): string => {
  if (!pathStr) return '';
  try {
    return new URL(pathStr, baseUrl).href;
  } catch (e) {
    return pathStr;
  }
};

export const getLinkPreview = async (url: string) => {
  if (!url) return null;

  try {
    const { result } = await ogs({ url, timeout: 3000 });

    if (result.success) {
      const urlObj = new URL(url);
      const isGitHub = urlObj.hostname === 'github.com' || urlObj.hostname.endsWith('.github.com');
      const rawImage = result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || '';
      let finalImagePath = '';

      // 只有在不是 GitHub 且有图片链接时处理
      if (!isGitHub && rawImage) {
        const absoluteImageUrl = ensureAbsoluteUrl(rawImage, url);
        const fileHash = hash(absoluteImageUrl);
        const fileName = `${fileHash}.png`;

        const previewsDir = path.join(baseDir, 'previews');
        const filePath = path.join(previewsDir, fileName);

        try {
          if (!fs.existsSync(previewsDir)) {
            fs.mkdirSync(previewsDir, { recursive: true });
          }

          if (!fs.existsSync(filePath)) {
            const buffer = await $fetch<ArrayBuffer>(absoluteImageUrl, {
              responseType: 'arrayBuffer',
            });
            fs.writeFileSync(filePath, Buffer.from(buffer));
          }
          // 统一返回接口路径
          finalImagePath = `/api/images/previews/${fileName}`;
        } catch (downloadError) {
          console.error('Image Cache Error:', downloadError);
          finalImagePath = absoluteImageUrl;
        }
      }

      return {
        url,
        title: result.ogTitle || result.twitterTitle || '无标题',
        description: result.ogDescription || result.twitterDescription || '',
        image: finalImagePath,
        siteName: result.ogSiteName || urlObj.hostname,
      };
    }
  } catch (e) {
    console.error('OGS Fetch Error:', url, e);
  }
  return null;
};

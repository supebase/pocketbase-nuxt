import ogs from 'open-graph-scraper';
import { hash } from 'ohash';
import fs from 'node:fs';
import path from 'node:path';

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
      const rawImage = result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || '';
      let finalImagePath = '';

      if (rawImage) {
        const absoluteImageUrl = ensureAbsoluteUrl(rawImage, url);
        const fileHash = hash(absoluteImageUrl);
        const fileName = `${fileHash}.png`;

        // 1. 确定物理路径：项目根目录/public/previews
        const publicDir = path.join(process.cwd(), 'public', 'previews');
        const filePath = path.join(publicDir, fileName);

        try {
          // 2. 确保目录存在
          if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
          }

          // 3. 如果文件不存在则下载
          if (!fs.existsSync(filePath)) {
            const buffer = await $fetch<ArrayBuffer>(absoluteImageUrl, {
              responseType: 'arrayBuffer',
            });
            fs.writeFileSync(filePath, Buffer.from(buffer));
          }

          // 4. 返回前端访问路径（对应 public 后的路径）
          finalImagePath = `/previews/${fileName}`;
        } catch (downloadError) {
          console.error('Image Cache Error:', downloadError);
          finalImagePath = absoluteImageUrl; // 失败降级
        }
      }

      return {
        url,
        title: result.ogTitle || result.twitterTitle || '无标题',
        description: result.ogDescription || result.twitterDescription || '',
        image: finalImagePath,
        siteName: result.ogSiteName || new URL(url).hostname,
      };
    }
  } catch (e) {
    console.error('OGS Fetch Error:', url, e);
  }

  return null;
};

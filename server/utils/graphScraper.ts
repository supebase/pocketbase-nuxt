/**
 * @file server/utils/graph-scraper.ts
 * @description 抓取链接的 Open Graph 元数据。
 * 不再负责本地缓存图片，仅返回原始图片链接供后续本地化处理。
 */
import ogs from 'open-graph-scraper';

const ensureAbsoluteUrl = (pathStr: string | undefined, baseUrl: string): string => {
  if (!pathStr) return '';
  try {
    // 处理相对路径，例如 "/assets/logo.png" 转为 "https://example.com/assets/logo.png"
    return new URL(pathStr, baseUrl).href;
  } catch (e) {
    return pathStr;
  }
};

export const getLinkPreview = async (url: string) => {
  if (!url) return null;

  try {
    // 1. 调用 ogs 抓取元数据
    const { result } = await ogs({ url, timeout: 3000 });

    if (result.success) {
      const urlObj = new URL(url);

      // 2. 提取原始图片链接
      const rawImage = result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || '';

      // 3. 确保是绝对路径
      const finalImage = rawImage ? ensureAbsoluteUrl(rawImage, url) : '';

      // 返回标准化数据
      return {
        url,
        title: result.ogTitle || result.twitterTitle || '无标题',
        description: result.ogDescription || result.twitterDescription || '',
        // 这里返回的是远程 URL，交给 API 路由去下载并存入 link_image 字段
        image: finalImage,
        siteName: result.ogSiteName || urlObj.hostname,
      };
    }
  } catch (e) {
    console.error('OGS Fetch Error:', url, e);
  }
  return null;
};

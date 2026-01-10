/**
 * 抓取链接的 Open Graph 元数据。
 * 不再负责本地缓存图片，仅返回原始图片链接供后续本地化处理。
 */
import ogs from 'open-graph-scraper';

const ensureAbsoluteUrl = (pathStr: string | undefined, baseUrl: string): string => {
  if (!pathStr) return '';
  try {
    // 处理相对路径
    return new URL(pathStr, baseUrl).href;
  } catch (e) {
    return pathStr;
  }
};

export const getLinkPreview = async (url: string) => {
  if (!url) return null;

  try {
    // 1. 调用 ogs 抓取元数据
    const { result } = await ogs({
      url,
      timeout: 3000,
      fetchOptions: {
        headers: {
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        },
      },
    });

    if (result.success) {
      const urlObj = new URL(url);
      const isGitHub = urlObj.hostname === 'github.com' || urlObj.hostname.endsWith('.github.com');
      // 2. 提取原始图片链接
      const rawImage = result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || '';
      // 3. 如果是 GitHub，则无图
      const finalImage = !isGitHub && rawImage ? ensureAbsoluteUrl(rawImage, url) : '';

      // 返回标准化数据
      return {
        url,
        title: result.ogTitle || result.twitterTitle || '无标题',
        description: result.ogDescription || result.twitterDescription || '',
        image: finalImage,
        siteName: result.ogSiteName || urlObj.hostname,
      };
    }
  } catch (e) {
    console.error('OGS Fetch Error:', url, e);
  }
  return null;
};

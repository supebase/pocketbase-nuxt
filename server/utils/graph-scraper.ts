/**
 * @file Link Preview Service
 * @description 抓取并解析远程链接的 Open Graph 元数据，用于生成卡片预览。
 */

import ogs from 'open-graph-scraper';
import type { LinkPreviewData } from '~/types';
import { getRandomUA } from '~/constants';

/**
 * 确保 URL 为绝对路径
 * @private
 */
const ensureAbsoluteUrl = (pathStr: string | undefined, baseUrl: string): string => {
  if (!pathStr) return '';
  try {
    // 自动合并相对路径 (如 /img/logo.png) 与基础域名
    return new URL(pathStr, baseUrl).href;
  } catch (e) {
    return pathStr;
  }
};

/**
 * 抓取链接元数据
 * @description 逻辑：抓取 HTML -> 提取 OG/Twitter 标签 -> 过滤 GitHub 特殊逻辑 -> 绝对路径转换
 * @returns {Promise<LinkPreviewData | null>} 标准化的预览数据对象
 */
export const getLinkPreview = async (url: string): Promise<LinkPreviewData | null> => {
  if (!url) return null;

  try {
    // 发起爬取请求，配置高仿真 User-Agent 以减少被拦截风险
    const { result } = await ogs({
      url,
      timeout: 5000,
      fetchOptions: {
        headers: {
          'user-agent': getRandomUA(),
        },
      },
    });

    if (result.success) {
      let isGitHub = false;
      let hostname = '';

      try {
        const urlObj = new URL(url);
        hostname = urlObj.hostname;
        isGitHub = hostname === 'github.com' || hostname.endsWith('.github.com');
      } catch (e) {
        // 如果 URL 解析失败，安全退回到非 GitHub 逻辑
      }

      // 优化点 2: 逻辑更直观
      let finalImage = '';

      if (!isGitHub) {
        const rawImage = result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || '';
        if (rawImage) {
          finalImage = ensureAbsoluteUrl(rawImage, url);
        }
      }

      return {
        url,
        title: result.ogTitle || result.twitterTitle || '无标题',
        description: result.ogDescription || result.twitterDescription || '',
        image: finalImage,
        siteName: result.ogSiteName || hostname || 'Unknown',
      };
    }
  } catch (e) {
    // console.error('[OGS Error] 抓取失败:', url, e);
  }
  return null;
};

/**
 * @file 链接预览生成工具
 * @description 使用 `open-graph-scraper` 库来抓取指定 URL 的元数据，
 *              生成用于在前端展示的链接预览信息（标题、描述、图片等）。
 */

// 导入 open-graph-scraper 库，这是一个专门用于解析网页 Open Graph 协议元数据的工具。
import ogs from 'open-graph-scraper';

/**
 * 为给定的 URL 生成链接预览数据。
 * 函数会尝试抓取 URL 内容，并解析其中的 Open Graph (og:*) 或 Twitter Card (twitter:*) 标签。
 *
 * @param url 需要生成预览的完整 URL 字符串。
 * @returns 如果成功解析，则返回一个包含标题、描述、图片、网站名称等信息的对象。
 *          如果 URL 无效、抓取失败或页面没有有效的元数据，则返回 null。
 */
export const getLinkPreview = async (url: string) => {
  // 如果传入的 url 为空或无效，则直接返回 null，避免不必要的处理。
  if (!url) return null;

  try {
    // 调用 open-graph-scraper (ogs) 来执行抓取和解析。
    // 设置一个 3 秒的超时时间 (timeout: 3000)，防止因目标网站响应缓慢而导致请求长时间挂起。
    const { result } = await ogs({ url, timeout: 3000 });

    // `result.success` 为 true 表示 OGS 成功抓取并解析了页面。
    if (result.success) {
      // 构建并返回一个标准化的链接预览对象。
      return {
        url, // 原始 URL
        // 优先使用 Open Graph 标题 (ogTitle)，如果不存在，则降级到 Twitter Card 标题 (twitterTitle)。
        title: result.ogTitle || result.twitterTitle || '',
        // 同样，优先使用 OG 描述，然后是 Twitter 描述。
        description: result.ogDescription || result.twitterDescription || '',
        // OG 图片和 Twitter 图片通常是一个数组，我们只取第一张图片的 URL。
        image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || '',
        // 优先使用 OG 网站名称。如果不存在，则从 URL 中提取主机名作为备用。
        siteName: result.ogSiteName || new URL(url).hostname,
        // (被注释掉的代码) 这是一个获取网站 favicon 的技巧，通过 Google 的服务。
        // 如果需要，可以取消注释来获取网站图标。
        // favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`
      };
    }
  } catch (e) {
    // 如果在抓取或解析过程中发生任何错误（如网络问题、超时、解析失败），
    // 在服务端控制台打印错误日志，以便于调试。
    // 不将此错误向上抛出，而是静默失败并返回 null，因为链接预览通常不是核心功能，
    // 不应因此导致整个 API 请求失败。
    console.error('OGS Fetch Error:', url, e);
  }

  // 如果 try-catch 块执行完毕仍未返回，说明处理失败，返回 null。
  return null;
};

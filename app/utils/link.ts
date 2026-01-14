/**
 * 检查是否为 GitHub 链接
 */
export const isGitHubUrl = (url: string): boolean => {
  try {
    const host = new URL(url).hostname;
    return host === 'github.com' || host.endsWith('.github.com');
  } catch {
    return false;
  }
};

/**
 * 格式化标题：移除 GitHub 前缀，如果是 GitHub 链接则截断冒号后的内容
 */
export const formatLinkTitle = (title: string, url: string): string => {
  if (!title) return '';

  let clean = title.replace(/^GitHub\s*-\s*/i, '');

  if (isGitHubUrl(url)) {
    // 即使 split 失败，(undefined || '') 也是字符串，trim 不会报错
    clean = (clean.split(':')[0] || '').trim();
  }

  return clean;
};

/**
 * 格式化显示用的 URL
 */
export const formatDisplayUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname;

    if (host === 'github.com') {
      return host;
    }

    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
};

/**
 * 格式化用户名：首字母大写，其余小写
 */
export function formatDefaultName(name: string): string {
  if (!name) return '';
  // 确保先转小写，再把首字母提出来大写
  const lower = name.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * 预处理邮箱：去空格并转小写
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * 格式化 IP 显示
 * 示例: 112.112.112.112 -> 112.112.*.*
 */
export const formatLocation = (location: string) => {
  if (!location) return '未知 IP';

  // 匹配 IPv4 的正则
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;

  if (ipv4Regex.test(location)) {
    const segments = location.split('.');
    return ` ${segments[0]}.${segments[1]}.*.*`;
  }

  return location;
};

export const formatIconName = (iconStr: string) => {
  if (!iconStr || !iconStr.includes(':')) return '';

  const str = iconStr.split(':')[1] || '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const formatLink = (url: string) => {
  if (!url) return ''; // 如果为空则返回空字符串

  // 检查是否以 http:// 或 https:// 开头
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // 否则加上 https://
  return `https://${url}`;
};

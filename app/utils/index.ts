/**
 * 清理 Markdown 语法，返回纯文本
 * @param text - 包含 Markdown 语法的文本
 * @returns 清理后的纯文本
 */
export function cleanMarkdown(text: string): string {
  if (typeof text !== 'string' || !text) return '';

  return (
    text
      // 1. 彻底移除图片语法 (包括描述文字)
      .replace(/!\[.*?\]\(.*?\)/g, '')

      // 2. 移除多行代码块
      .replace(/```[\s\S]*?```/g, '')

      // 3. 处理普通链接：保留文字，移除地址 [文字](链接) -> 文字
      .replace(/\[(.+?)\]\(.+?\)({target=_blank})?/g, '$1')

      // 4. 清理标题、粗体、斜体、删除线、行内代码
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/~~(.+?)~~/g, '$1')
      .replace(/`(.+?)`/g, '$1')

      // 5. 清理引用和列表符号
      .replace(/>\s/g, '')
      .replace(/\n\s*[-*+]\s/g, '\n')
      .replace(/\n\s*\d+\.\s/g, '\n')

      // 6. 其他清理
      .replace(/::.*?::/gs, '')
      .trim()
  );
}

/**
 * 从 Markdown 字符串中提取第一张图片的 URL
 */
export const getFirstImageUrl = (content: string): string | null => {
  if (!content) return null;

  // 1. 匹配标准 Markdown 图片语法: ![alt](url)
  const mdImageRegex = /!\[.*?\]\((.*?)\)/;
  const mdMatch = content.match(mdImageRegex);
  if (mdMatch && mdMatch[1]) {
    return mdMatch[1];
  }

  // 2. 备选：匹配 HTML img 标签: <img src="url">
  const htmlImageRegex = /<img.*?src=["'](.*?)["']/;
  const htmlMatch = content.match(htmlImageRegex);
  if (htmlMatch && htmlMatch[1]) {
    return htmlMatch[1];
  }

  return null;
};

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

import { READ_SPEED_CONFIG } from '~/constants';

/**
 * 计算文章阅读时间的组合式函数
 */
export const useReadingTime = (content: string, externalImagesCount: number = 0): string => {
  const safeContent = content || '';

  /**
   * 计算代码块阅读时间
   */
  const calculateCodeTime = (contentWithCode: string): number => {
    const codeBlocks = contentWithCode.match(/```[\s\S]*?```/g) || [];
    return codeBlocks.reduce((total, block) => {
      const lines = Math.max(0, block.split('\n').length - 2);
      return total + READ_SPEED_CONFIG.CODE_BLOCK_BASE_TIME + lines * READ_SPEED_CONFIG.CODE_LINE_TIME;
    }, 0);
  };

  /**
   * 计算文本内容阅读时间（核心修复部分）
   */
  const calculateTextTime = (rawMarkdown: string): number => {
    // 1. 彻底清洗 Markdown 语法，只保留人类阅读的文字
    const cleanText = rawMarkdown
      .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片语法整个结构
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 移除链接语法，但保留链接内的文字（因为文字是要读的）
      .replace(/[#*`~_>]/g, '') // 移除标题、加粗、行内代码、引用等符号
      .replace(/\s+/g, ' '); // 压缩多余空格

    // 2. 计算汉字
    const chineseChars = cleanText.match(/\p{Unified_Ideograph}/gu)?.length || 0;

    // 3. 计算英文单词
    const englishWords = cleanText
      .replace(/\p{Unified_Ideograph}/gu, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    return (
      chineseChars / READ_SPEED_CONFIG.CHINESE_CHARS_PER_MINUTE + englishWords / READ_SPEED_CONFIG.WORDS_PER_MINUTE
    );
  };

  /**
   * 计算图片查看时间
   */
  const calculateImageTime = (imagesCount: number): number => {
    return imagesCount > 0 ? READ_SPEED_CONFIG.CAROUSEL_BASE_TIME + imagesCount * READ_SPEED_CONFIG.IMAGE_TIME : 0;
  };

  // --- 执行逻辑 ---

  // 1. 提取并移除代码块（代码块单独计算时间）
  const contentWithoutCode = safeContent.replace(/```[\s\S]*?```/g, '');

  // 2. 在移除代码块后的内容中精准统计 Markdown 图片数量
  const markdownImagesCount = (contentWithoutCode.match(/!\[.*?\]\(.*?\)/g) || []).length;
  const totalImages = markdownImagesCount + externalImagesCount;

  // 3. 汇总计算
  const codeTime = calculateCodeTime(safeContent);
  const imageTime = calculateImageTime(totalImages);

  // 关键：将清洗过代码块的内容传给文本计算函数，函数内部会处理 Markdown 语法污染
  const textTime = calculateTextTime(contentWithoutCode);

  // 向上取整，最少展示 1 分钟
  const totalMinutes = Math.max(1, Math.ceil(textTime + imageTime + codeTime));

  return `${totalMinutes} 分钟阅读`;
};

import { READ_SPEED_CONFIG } from '~/constants';

/**
 * 计算文章阅读时间的组合式函数
 * @param content - 文章内容（包含 Markdown 格式）
 * @param externalImagesCount - 外部图片数量（如封面图等）
 * @returns 预计阅读时间（分钟）字符串
 */
export const useReadingTime = (content: string, externalImagesCount: number = 0): string => {
  const safeContent = content || '';

  /**
   * 计算代码块阅读时间
   * @param contentWithCode - 原始包含代码的内容
   * @returns 代码阅读时间（分钟）
   */
  const calculateCodeTime = (contentWithCode: string): number => {
    const codeBlocks = contentWithCode.match(/```[\s\S]*?```/g) || [];

    return codeBlocks.reduce((total, block) => {
      // 减去代码块标记 ``` 的两行
      const lines = Math.max(0, block.split('\n').length - 2);
      return (
        total + READ_SPEED_CONFIG.CODE_BLOCK_BASE_TIME + lines * READ_SPEED_CONFIG.CODE_LINE_TIME
      );
    }, 0);
  };

  /**
   * 计算文本内容阅读时间
   * @param textOnlyContent - 已经剔除了代码块的纯文本内容
   * @returns 文本阅读时间（分钟）
   */
  const calculateTextTime = (textOnlyContent: string): number => {
    // 使用 Unicode 属性匹配所有汉字，比旧正则更严谨
    const chineseChars = textOnlyContent.match(/\p{Unified_Ideograph}/gu)?.length || 0;

    // 将汉字替换为空格，确保 "Hello世界" 被正确识别为 "Hello"
    const englishWords = textOnlyContent
      .replace(/\p{Unified_Ideograph}/gu, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    return (
      chineseChars / READ_SPEED_CONFIG.CHINESE_CHARS_PER_MINUTE +
      englishWords / READ_SPEED_CONFIG.WORDS_PER_MINUTE
    );
  };

  /**
   * 计算图片查看时间
   * @param imagesCount - 图片总数量
   * @returns 图片查看时间（分钟）
   */
  const calculateImageTime = (imagesCount: number): number => {
    return imagesCount > 0
      ? READ_SPEED_CONFIG.CAROUSEL_BASE_TIME + imagesCount * READ_SPEED_CONFIG.IMAGE_TIME
      : 0;
  };

  // --- 执行逻辑 ---

  // 1. 预处理：剔除代码块，用于后续计算图片和文本
  const contentWithoutCode = safeContent.replace(/```[\s\S]*?```/g, '');

  // 2. 提取正文图片数量
  const markdownImagesCount = (contentWithoutCode.match(/!\[.*?\]\(.*?\)/g) || []).length;
  const totalImages = markdownImagesCount + externalImagesCount;

  // 3. 汇总计算
  const codeTime = calculateCodeTime(safeContent);
  const textTime = calculateTextTime(contentWithoutCode);
  const imageTime = calculateImageTime(totalImages);

  // 向上取整，最少展示 1 分钟
  const totalMinutes = Math.max(1, Math.ceil(textTime + imageTime + codeTime));

  return `${totalMinutes} 分钟阅读`;
};

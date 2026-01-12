/**
 * 根据内容长度百分比获取对应的颜色
 * @param  内容长度百分比（0-100）
 * @returns 对应的颜色字符串
 */
export const getContentLengthColor = (percent: number) => {
  if (percent >= 100) return 'error' as const;
  if (percent >= 80) return 'warning' as const;
  return 'neutral' as const;
};

export const getChineseWordCount = (editor: any) => {
  const text = editor.getText(); // 获取纯文本
  if (!text) return 0;

  // 匹配中文词汇（近似逻辑：匹配连续汉字、或者英文单词）
  // 或者更简单的做法：中文统计里，通常“字”就是“词”
  // 这里演示一个简单的正则：匹配汉字 + 英文单词
  const words = text.match(/[\u4e00-\u9fa5]|\b\w+\b/g);
  return words ? words.length : 0;
};

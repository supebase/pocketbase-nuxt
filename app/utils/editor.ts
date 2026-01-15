/**
 * 根据内容长度百分比获取对应的颜色
 * @param  内容长度百分比（0-100）
 * @returns 对应的颜色字符串
 */
import { CONTENT_COLOR_MAP } from '~/constants/editor';

export const getContentLengthColor = (current: number, max: number) => {
  const percent = (current / max) * 100;

  if (percent >= 100) return CONTENT_COLOR_MAP.ERROR;
  if (percent >= 80) return CONTENT_COLOR_MAP.WARNING;

  return CONTENT_COLOR_MAP.NEUTRAL;
};

export const getChineseWordCount = (editor: any) => {
  if (!editor) return 0;

  const text = editor.getText();
  // 更加专业的统计逻辑：匹配汉字 + 英文/数字单词
  const words = text.match(/[\u4e00-\u9fa5]|[a-zA-Z0-9_]+/g);
  return words ? words.length : 0;
};

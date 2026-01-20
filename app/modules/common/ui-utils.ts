/**
 * 数字拆解逻辑：支持 999 变 1,000 的平滑插入
 */
export const processAnimateDigits = (value: number) => {
  const formatter = new Intl.NumberFormat('en-US');
  const str = formatter.format(value);
  const chars = str.split('').reverse();

  let digitIndex = 0;
  return chars.map((char) => {
    const isDigit = /\d/.test(char);
    if (isDigit) {
      return { id: `d-${digitIndex++}`, digit: char, isComma: false };
    }
    return { id: `s-${digitIndex}`, digit: char, isComma: true };
  });
};

/**
 * 解析点赞数据字符串
 */
export const parseReactionMessage = (content: string): Record<string, number> => {
  const result: Record<string, number> = {};
  content.split(',').forEach((pair) => {
    const [emoji, count] = pair.split(':');
    if (emoji && count) result[emoji] = parseInt(count);
  });
  return result;
};

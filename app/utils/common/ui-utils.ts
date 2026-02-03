/**
 * 数字拆解逻辑：支持 999 变 1,000 的平滑插入
 */
export const processAnimateDigits = (value: number) => {
  const str = new Intl.NumberFormat('en-US').format(value);
  const chars = str.split('');
  const n = chars.length;

  return chars.map((char, index) => {
    const isDigit = /\d/.test(char);
    const rightSideDigits = chars.slice(index + 1).filter((c) => /\d/.test(c)).length;
    const idPrefix = isDigit ? 'd' : 's';

    return {
      // 这里的 ID 保证了：无论左边增加多少位，右边的数字 ID 永远不变
      id: `${idPrefix}-${rightSideDigits}`,
      digit: char,
      isComma: !isDigit,
    };
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

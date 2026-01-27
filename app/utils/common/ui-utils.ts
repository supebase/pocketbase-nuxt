/**
 * 数字拆解逻辑：支持 999 变 1,000 的平滑插入
 */
export const processAnimateDigits = (value: number) => {
  const formatter = new Intl.NumberFormat('en-US');
  const str = formatter.format(value);
  // 不要在 utils 里反转数组，保持字符串顺序，但在生成 ID 时参考其从右往左的权重
  const chars = str.split('');
  const length = chars.length;

  return chars.map((char, index) => {
    const isDigit = /\d/.test(char);
    // 关键点：ID 基于从右向左的距离生成
    // 比如 1,234 中的 '4' 是 pos-0, '3' 是 pos-1...
    // 这样当数字变成 12,345 时，'4' 和 '5' 的位移关系依然能被 Vue 识别
    const reverseIndex = length - 1 - index;

    return {
      id: isDigit ? `d-${reverseIndex}` : `s-${reverseIndex}`,
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

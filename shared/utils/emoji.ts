const emojiRegex =
  /^(\p{ExtPict}|\p{Emoji}(\p{EMod})?|\p{Emoji}\uFE0F|\p{Emoji}\u20E3|[\u{1F3FB}-\u{1F3FF}]|[\u{1F1E6}-\u{1F1FF}]{2}|\p{Emoji}[\u{E0020}-\u{E007E}]+\u{E007F}|\p{Emoji}(\uFE0F)?(\u200D\p{Emoji}(\uFE0F)?)+)$/u;

export function isValidEmoji(str: string): boolean {
  if (!str) return false;
  return emojiRegex.test(str);
}

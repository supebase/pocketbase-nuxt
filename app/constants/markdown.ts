interface CleanRule {
  name: string;
  pattern: RegExp;
  replacement: string;
}

export const MARKDOWN_CLEAN_RULES: CleanRule[] = [
  { name: 'images', pattern: /!\[.*?\]\(.*?\)/g, replacement: '' },
  { name: 'codeBlocks', pattern: /```[\s\S]*?```/g, replacement: '' },
  { name: 'links', pattern: /\[([^\]]+)\]\([^)]+\)(?:\{target=_blank\})?/g, replacement: '$1' },
  { name: 'headers', pattern: /#{1,6}\s/g, replacement: '' },
  { name: 'bold', pattern: /\*\*(.+?)\*\*/g, replacement: '$1' },
  { name: 'italic', pattern: /\*(.+?)\*/g, replacement: '$1' },
  { name: 'strike', pattern: /~~(.+?)~~/g, replacement: '$1' },
  { name: 'inlineCode', pattern: /`(.+?)`/g, replacement: '$1' },
  { name: 'blockquotes', pattern: /^>\s+/gm, replacement: '' },
  { name: 'lists', pattern: /^\s*([-*+ \d+\.])\s+/gm, replacement: '' },
  { name: 'iframes', pattern: /<iframe[^>]*>.*?<\/iframe>|<iframe[^>]*\/?>/gis, replacement: '' },
  { name: 'mdcComponents', pattern: /::.*?::/gs, replacement: '' },
  { name: 'hr', pattern: /^\s*[-*_]{3,}\s*$/gm, replacement: '' },
  { name: 'extraNewlines', pattern: /\n+/g, replacement: ' ' },
];

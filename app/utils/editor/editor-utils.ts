import type { Editor } from '@tiptap/vue-3';
import { CONTENT_COLOR_MAP } from '~/constants/editor';

/**
 * 统计逻辑：匹配汉字 + 英文/数字单词
 */
export const getChineseWordCount = (editor: Editor | null): number => {
  if (!editor) return 0;
  const text = editor.getText() || '';
  const words = text.match(/[\u4e00-\u9fa5]|[a-zA-Z0-9_]+/g);
  return words ? words.length : 0;
};

export const getContentLengthColor = (current: number, max: number) => {
  const percent = (current / max) * 100;
  if (percent >= 100) return CONTENT_COLOR_MAP.ERROR;
  if (percent >= 80) return CONTENT_COLOR_MAP.WARNING;
  return CONTENT_COLOR_MAP.NEUTRAL;
};

export function getSafeTextAfter(editor: Editor, from: number, length: number) {
  const doc = editor.state.doc;
  const docSize = doc.content.size;
  const safeFrom = Math.max(0, Math.min(from, docSize));
  const safeTo = Math.min(safeFrom + length, docSize);
  return safeFrom === safeTo ? '' : doc.textBetween(safeFrom, safeTo);
}

// 保持你修改后的 Handler 生成器
export const createCustomCodeBlockHandlers = (openModal: () => void) => {
  return {
    customCodeBlock: {
      canExecute: () => true,
      execute: (editor: any) => {
        openModal();
        return editor.chain().focus();
      },
      isActive: () => false,
      isDisabled: () => false,
    },
  };
};

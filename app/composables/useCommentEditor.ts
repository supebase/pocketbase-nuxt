import { MENTION_REGEX } from '~/constants';

interface EditorResult {
  newText: string;
  moveCursor: () => void;
}

export const useCommentEditor = (textareaRef: Ref<any>) => {
  const textareaElement = ref<HTMLTextAreaElement | null>(null);

  // 缓存获取 DOM
  const getRawTextarea = () => {
    if (textareaElement.value && document.body.contains(textareaElement.value)) {
      return textareaElement.value;
    }
    const el = textareaRef.value?.$el?.querySelector('textarea') || textareaRef.value?.textarea;
    if (el) textareaElement.value = el as HTMLTextAreaElement;
    return textareaElement.value;
  };

  // 在光标处插入文本
  const insertAtCursor = (currentValue: string, content: string): EditorResult => {
    const textarea = getRawTextarea();

    if (!textarea) {
      return {
        newText: currentValue,
        moveCursor: () => {},
      };
    }

    const { selectionStart, selectionEnd } = textarea;
    const newText = currentValue.substring(0, selectionStart) + content + currentValue.substring(selectionEnd);

    // 返回新文本和光标重定位函数
    const moveCursor = () => {
      nextTick(() => {
        const newPos = selectionStart + content.length;
        textarea.focus();
        textarea.setSelectionRange(newPos, newPos);
      });
    };

    return { newText, moveCursor };
  };

  // 处理退格删除提及
  const handleMentionBackspace = (currentValue: string, e: KeyboardEvent) => {
    const textarea = getRawTextarea();
    if (!textarea) return currentValue;

    const { selectionStart, selectionEnd } = textarea;
    if (selectionStart !== selectionEnd) return currentValue;

    const textBeforeCursor = currentValue.substring(0, selectionStart);
    const mentionMatch = textBeforeCursor.match(MENTION_REGEX);

    if (mentionMatch) {
      const matchString = mentionMatch[0];
      const matchStart = selectionStart - matchString.length;
      e.preventDefault();

      const newText = currentValue.substring(0, matchStart) + currentValue.substring(selectionEnd);
      nextTick(() => {
        textarea.setSelectionRange(matchStart, matchStart);
        textarea.focus();
      });
      return newText;
    }
    return currentValue;
  };

  return { getRawTextarea, insertAtCursor, handleMentionBackspace };
};

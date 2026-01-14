import type { EditorHandler } from '@nuxt/ui';

export const createCustomCodeBlockHandler = (openModal: () => void): EditorHandler => {
  return {
    canExecute: () => true,
    execute: (editor: any) => {
      openModal();
      return editor.chain().focus();
    },
    isActive: () => false,
    isDisabled: () => false,
  };
};

export const createCustomCodeBlockHandlers = (openModal: () => void) => {
  return {
    customCodeBlock: createCustomCodeBlockHandler(openModal),
  };
};

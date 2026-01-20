export const EDITOR_STARTER_KIT: any = {
  codeBlock: false as const,
  link: {
    autolink: false,
    HTMLAttributes: {
      rel: 'noopener noreferrer',
      target: '_blank',
    },
  },
};

export const EDITOR_UI_CONFIG = {
  content:
    'w-xl relative left-1/2 right-1/2 -translate-x-1/2 prose dark:prose-invert max-w-none min-h-[400px] focus:outline-none pt-3 pb-10',
};

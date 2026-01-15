import type { EditorToolbarItem } from '@nuxt/ui';

export const items: EditorToolbarItem[][] = [
  [
    {
      icon: 'i-hugeicons:heading',
      content: {
        align: 'start',
      },
      items: [
        {
          kind: 'heading',
          level: 1,
          icon: 'i-hugeicons:heading-01',
          label: '一级标题',
        },
        {
          kind: 'heading',
          level: 2,
          icon: 'i-hugeicons:heading-02',
          label: '二级标题',
        },
        {
          kind: 'heading',
          level: 3,
          icon: 'i-hugeicons:heading-03',
          label: '三级标题',
        },
        {
          kind: 'heading',
          level: 4,
          icon: 'i-hugeicons:heading-04',
          label: '四级标题',
        },
      ],
    },
  ],
  [
    {
      kind: 'mark',
      mark: 'bold',
      icon: 'i-hugeicons:text-bold',
    },
    {
      kind: 'mark',
      mark: 'italic',
      icon: 'i-hugeicons:text-italic',
    },
    {
      kind: 'mark',
      mark: 'underline',
      icon: 'i-hugeicons:text-underline',
    },
    {
      kind: 'mark',
      mark: 'strike',
      icon: 'i-hugeicons:text-strikethrough',
    },
  ],
  [
    {
      kind: 'bulletList',
      icon: 'i-hugeicons:left-to-right-list-dash',
    },
    {
      kind: 'orderedList',
      icon: 'i-hugeicons:left-to-right-list-number',
    },
  ],
  [
    {
      kind: 'blockquote',
      icon: 'i-hugeicons:left-to-right-block-quote',
      label: '引用',
    },
    // {
    //   kind: 'link',
    //   icon: 'i-hugeicons:link-01',
    // },
  ],
  [
    {
      kind: 'image',
      icon: 'i-hugeicons:image-03',
    },
    {
      kind: 'customCodeBlock',
      icon: 'i-hugeicons:source-code',
      label: '代码块',
    },
    {
      kind: 'horizontalRule',
      icon: 'i-hugeicons:solid-line-01',
      label: '分隔线',
    },
  ],
];

export const CONTENT_COLOR_MAP = {
  ERROR: 'error' as const,
  WARNING: 'warning' as const,
  NEUTRAL: 'neutral' as const,
};

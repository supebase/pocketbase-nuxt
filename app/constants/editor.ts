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
          label: 'Heading 1',
        },
        {
          kind: 'heading',
          level: 2,
          icon: 'i-hugeicons:heading-02',
          label: 'Heading 2',
        },
        {
          kind: 'heading',
          level: 3,
          icon: 'i-hugeicons:heading-03',
          label: 'Heading 3',
        },
        {
          kind: 'heading',
          level: 4,
          icon: 'i-hugeicons:heading-04',
          label: 'Heading 4',
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
      icon: 'i-hugeicons:left-to-right-list-bullet',
    },
    {
      kind: 'orderedList',
      icon: 'i-hugeicons:left-to-right-list-number',
    },
    {
      kind: 'blockquote',
      icon: 'i-hugeicons:left-to-right-block-quote',
    },
    // {
    //   kind: 'link',
    //   icon: 'i-hugeicons:link-01',
    // },
  ],
  [
    {
      kind: 'customCodeBlock',
      icon: 'i-hugeicons:code',
    },
    {
      kind: 'horizontalRule',
      icon: 'i-hugeicons:solid-line-01',
    },
  ],
];

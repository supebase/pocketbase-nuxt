import type { SkeletonItem } from '~/types';

// 1. Comments 骨架配置
export const SKELETON_COMMENTS: SkeletonItem[] = [
  {
    type: 'group',
    class: 'flex items-center gap-4 mb-6 opacity-50',
    items: [
      { type: 'divider', class: 'h-px flex-1' },
      { type: 'rect', class: 'h-4 w-16' },
      { type: 'divider', class: 'h-px flex-1' },
    ],
  },
  {
    type: 'group',
    count: 2,
    class: 'flex flex-col pt-2 pb-6',
    items: [
      {
        type: 'group',
        class: 'flex gap-4',
        items: [
          { type: 'circle', class: 'size-8 flex-none' },
          {
            type: 'group',
            class: 'flex-1 pt-1',
            items: [
              {
                type: 'group',
                class: 'flex justify-between items-center mb-3',
                items: [
                  { type: 'rect', class: 'h-4 w-24' },
                  { type: 'rect', class: 'h-4 w-10' },
                ],
              },
              {
                type: 'group',
                class: 'space-y-2 mb-3',
                items: [
                  { type: 'rect', class: 'h-4 w-full' },
                  { type: 'rect', class: 'h-4 w-[90%]' },
                ],
              },
              { type: 'rect', class: 'h-3 w-32 opacity-50' },
            ],
          },
        ],
      },
    ],
  },
];

// 2. Posts 列表骨架 (最难还原的部分：包含连线)
export const SKELETON_POSTS = (count: number): SkeletonItem[] => [
  {
    type: 'group',
    count,
    class: 'relative flex gap-4 mb-4', // 每一行
    items: [
      {
        type: 'group',
        class: 'relative flex flex-col items-center shrink-0',
        // 只有不是最后一行时才显示线
        // 由于 Generator 是函数，我们可以通过逻辑控制
        get hasLine() {
          return true;
        },
        items: [{ type: 'circle', class: 'size-8' }],
      },
      {
        type: 'group',
        class: 'flex-1 space-y-4 pb-4',
        items: [
          {
            type: 'group',
            class: 'flex items-center justify-between mt-1',
            items: [
              { type: 'rect', class: 'h-5 w-32' },
              { type: 'rect', class: 'h-4 w-20' },
            ],
          },
          {
            type: 'group',
            class: 'space-y-2',
            items: [
              { type: 'rect', class: 'h-4 w-full' },
              { type: 'rect', class: 'h-4 w-full' },
              { type: 'rect', class: 'h-4 w-[40%]' },
            ],
          },
          { type: 'rect', class: 'h-64 w-full rounded-lg' },
          {
            type: 'group',
            class: 'flex items-center gap-2',
            items: [
              { type: 'circle', class: 'size-6' },
              { type: 'rect', class: 'h-4 w-16 rounded-lg' },
            ],
          },
        ],
      },
    ],
  },
];

// 3. Post & MDC (文章详情)
export const SKELETON_ARTICLE = (showAuthor: boolean): SkeletonItem[] => {
  const content: SkeletonItem[] = [
    { type: 'rect', class: 'h-9 w-2/3 mb-6' },
    {
      type: 'group',
      count: 3,
      class: 'space-y-6',
      items: [
        {
          type: 'group',
          class: 'space-y-3',
          items: [
            { type: 'rect', class: 'h-4 w-full' },
            { type: 'rect', class: 'h-4 w-full' },
            { type: 'rect', class: 'h-4 w-5/6' },
            { type: 'rect', class: 'h-4 w-4/6' },
          ],
        },
        // 这里模拟 Post.vue 中的中间插图
        { type: 'rect', class: 'h-64 w-full rounded-lg my-6' },
      ],
    },
  ];

  if (showAuthor) {
    content.unshift({
      type: 'group',
      class: 'flex items-center justify-between mb-6',
      items: [
        {
          type: 'group',
          class: 'flex items-center gap-3',
          items: [
            { type: 'circle', class: 'size-8' },
            { type: 'rect', class: 'h-4 w-40' },
          ],
        },
        { type: 'rect', class: 'h-4 w-18' },
      ],
    });
  }

  return content;
};

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const CustomLinkTarget = Extension.create({
  name: 'customLinkTarget',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('customLinkTarget'),
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            const suffix = '{target=_blank}';
            const doc = state.doc;

            doc.descendants((node, pos) => {
              if (!node.isText || !node.text) return;

              let index = node.text.indexOf(suffix);

              while (index !== -1) {
                const from = pos + index;
                const to = from + suffix.length;

                // 1. 创建 Widget 装饰（视觉标签）
                decorations.push(
                  Decoration.widget(from, () => {
                    const dom = document.createElement('span');
                    // 使用 Nuxt UI 风格的样式
                    dom.className =
                      'inline-flex items-center gap-1 mx-1 px-1.5 text-[11px] font-medium bg-neutral-50 text-muted dark:bg-neutral-400/10 rounded-lg select-none cursor-default';

                    // 插入一个图标
                    const icon = document.createElement('span');
                    icon.className = 'i-hugeicons:link-square-01 w-3 h-3';

                    const text = document.createElement('span');
                    text.innerText = '新窗口';

                    dom.appendChild(icon);
                    dom.appendChild(text);
                    return dom;
                  }),
                );

                // 2. 创建 Inline 装饰（隐藏原始文本）
                decorations.push(
                  Decoration.inline(from, to, {
                    style: 'opacity: 0; font-size: 0; position: absolute; pointer-events: none;',
                    class: 'link-suffix-hidden',
                  }),
                );

                index = node.text.indexOf(suffix, index + 1);
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});

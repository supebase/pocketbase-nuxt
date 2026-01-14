import CodeBlock from '@tiptap/extension-code-block';
import { InputRule } from '@tiptap/core';

export const CustomCodeBlock = CodeBlock.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      filename: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-filename'),
        renderHTML: (attributes) => (attributes.filename ? { 'data-filename': attributes.filename } : {}),
      },
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize: (state: any, node: any) => {
          const { language, filename } = node.attrs;
          const info = (language || '') + (filename ? ` [${filename}]` : '');

          state.write('```' + info + '\n');
          state.text(node.textContent, false);
          state.ensureNewLine();
          state.write('```');
          state.closeBlock(node);
        },

        parse: {
          setup: (markdownit: any) => {
            const fence = markdownit.renderer.rules.fence;

            markdownit.renderer.rules.fence = (tokens: any[], idx: number, options: any, env: any, self: any) => {
              const token = tokens[idx];
              const info = token.info.trim();
              const match = info.match(/^(\w+)?(?:\s+\[(.+?)\])?$/);

              if (match) {
                token.info = match[1] || '';
                token.meta = {
                  ...(token.meta || {}),
                  filename: match[2] || null,
                };
              }

              return fence ? fence(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options);
            };
          },
        },
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const info = node.attrs.language || '';
    const match = info.match(/^(\w+)(?:\s+\[(.+?)\])?$/);

    const language = match?.[1];
    const filename = match?.[2];

    return [
      'pre',
      HTMLAttributes,
      ...(filename ? [['div', { class: 'code-filename', contenteditable: 'false' }, `[${filename}]`]] : []),
      ['code', { class: language ? `language-${language}` : null }, 0],
    ];
  },

  addInputRules() {
    return [
      new InputRule({
        find: /^```([a-z]+)?(?:\s+\[(.+?)\])?[\s\n]$/,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const language = match[1] || '';
          const filename = match[2];

          const info = filename ? `${language} [${filename}]` : language;

          tr.replaceWith(
            range.from,
            range.to,
            this.type.create({
              language: info,
            }),
          );
        },
      }),
    ];
  },
});

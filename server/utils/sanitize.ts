import sanitizeHtml from 'sanitize-html';

/**
 * 统一的文章内容安全清洗配置
 */
export const sanitizePostContent = (content: string) => {
    return sanitizeHtml(content, {
        allowedTags: [
            ...sanitizeHtml.defaults.allowedTags,
            'img',
            'details',
            'summary',
            'h1',
            'h2',
            'span',
        ],
        allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
            code: ['class'],
            span: ['class'],
            div: ['class'],
        },
        transformTags: {
            a: sanitizeHtml.simpleTransform('a', { rel: 'nofollow' }),
        },
    });
};
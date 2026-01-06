// import sanitizeHtml from 'sanitize-html';

/**
 * 统一的文章内容安全清洗配置
 */
export const sanitizePostContent = (content: string) => {
    // 暂时不做转义！
    return content;

    // return sanitizeHtml(content, {
    //     allowedTags: [
    //         ...sanitizeHtml.defaults.allowedTags,
    //         'img', 'details', 'summary', 'h1', 'h2', 'span',
    //         'pre', 'code', 'div', 'hr', 'br'
    //     ],
    //     allowedAttributes: {
    //         ...sanitizeHtml.defaults.allowedAttributes,
    //         // 允许代码块高亮所需的 class (Prism/Shiki 等工具使用)
    //         '*': ['class', 'style'],
    //         'img': ['src', 'alt', 'title', 'width', 'height', 'loading'],
    //         'a': ['href', 'name', 'target', 'rel'],
    //     },
    //     // 如果用户提交了 <script>，将其转义为普通文本显示，而不是直接删除
    //     // 这样可以保留教程中的代码示例，同时消除执行风险
    //     disallowedTagsMode: 'escape',

    //     transformTags: {
    //         'a': sanitizeHtml.simpleTransform('a', {
    //             rel: 'nofollow',
    //             target: '_blank'
    //         }),
    //     },
    // });
};
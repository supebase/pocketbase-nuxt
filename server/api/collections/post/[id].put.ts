import { updatePost } from '../../../services/posts.service';
import { handlePocketBaseError } from '../../../utils/errorHandler';
import sanitizeHtml from 'sanitize-html';

export default defineEventHandler(async (event) => {
    // 1. 获取当前登录用户
    const session = await getUserSession(event);
    const user = session?.user;

    if (!user) {
        throw createError({
            statusCode: 401,
            message: '请先登录后操作', // 改为 message
            statusMessage: 'Unauthorized',
        });
    }

    // 获取路由参数
    const postId = getRouterParam(event, 'id');

    // 参数验证
    if (!postId) {
        throw createError({
            statusCode: 400,
            // 遵循新标准：message 存放中文，statusMessage 存放简短英文
            message: '文章 ID 不能为空',
            statusMessage: 'Bad Request',
        });
    }

    // 2. 读取请求体
    const { content, allow_comment, published, icon, action } = await readBody(event);

    // 3. 参数验证 (初步)
    if (!content || typeof content !== 'string') {
        throw createError({
            statusCode: 400,
            message: '内容不能为空', // 改为 message
            statusMessage: 'Bad Request',
        });
    }

    // 4. HTML 清洗
    const cleanContent = sanitizeHtml(content, {
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

    // 5. 内容长度限制 (使用清洗后的内容)
    // 注意：如果清洗后只剩下空白字符，也应该拦截
    if (cleanContent.trim().length === 0) {
        throw createError({
            statusCode: 400,
            message: '有效内容不能为空',
            statusMessage: 'Bad Request',
        });
    }

    if (cleanContent.length > 10000) {
        throw createError({
            statusCode: 400,
            message: '内容长度不能超过 10000 字符',
            statusMessage: 'Payload Too Large',
        });
    }

    try {
        // 6. 更新文章记录
        const post = await updatePost(postId, {
            content: cleanContent,
            user: user.id,
            allow_comment: allow_comment,
            published: published,
            icon: icon,
            action: action,
        });

        return {
            message: '内容更新成功',
            data: { post }, // 保持与 AuthResponse 类似的 data 结构（可选）
        };
    } catch (error) {
        // 这里内部已经按照我们的新标准抛出 message 了
        handlePocketBaseError(error, '内容更新失败');
    }
});

/**
 * @file API Route: /api/collections/comments [POST]
 * @description 创建新评论的 API 端点。
 *              该接口负责处理用户提交的评论，执行安全检查和数据验证，
 *              然后将新评论存入数据库。
 */
import { createComment } from '../../services/comments.service';
import { defineApiHandler } from '~~/server/utils/api-wrapper';
import type { Create } from '~/types/pocketbase-types';
import type { CreateCommentRequest } from '~/types/comments';
import sanitizeHtml from 'sanitize-html';

/**
 * 定义处理创建评论请求的事件处理器。
 */
export default defineApiHandler(async (event) => {
	// 步骤 1: 进行身份验证。
	// 必须确保请求来自一个已登录的用户，因为我们需要将评论与用户关联。
	// 新增: 从事件上下文中获取用户信息
	// 认证逻辑已由中间件统一处理，此处可安全地使用非空断言 `!`。
	const pb = event.context.pb;
	const user = event.context.user!;

	// 步骤 2: 读取并解析请求体。
	const body = await readBody<CreateCommentRequest>(event);
	const { comment: rawComment, post } = body;

	// 步骤 3: **核心安全措施** - 清理评论内容。
	// 使用 `sanitize-html` 库，并配置其彻底禁止所有 HTML 标签和属性。
	// `disallowedTagsMode: 'discard'` 会直接移除所有不被允许的标签。
	// 这样做可以有效防止 XSS (跨站脚本) 攻击。
	// 最后使用 `.trim()` 移除首尾的空白字符。
	const cleanComment = sanitizeHtml(rawComment || '', {
		allowedTags: [],
		allowedAttributes: {},
		disallowedTagsMode: 'discard',
	}).trim();

	// 步骤 4: 进行业务参数验证。
	// 检查评论必须关联到一个帖子 (post)。
	if (!post) {
		throw createError({
			statusCode: 400,
			message: '关联的内容 ID 不能为空',
		});
	}

	// 检查经过清理后的评论内容是否为空。
	if (!cleanComment) {
		throw createError({
			statusCode: 400,
			message: '评论内容不能为空',
		});
	}

	// 步骤 5: 检查评论内容的长度限制。
	if (cleanComment.length > 300) {
		throw createError({
			statusCode: 400,
			message: '评论内容字数已达上限 (300)',
		});
	}

	// 步骤 6: 构造符合数据库 `comments` 集合结构的 payload。
	// 这是即将要插入数据库的最终数据。
	const createData: Create<'comments'> = {
		comment: cleanComment,
		post: post,
		user: user.id,
	};

	// 步骤 7: 调用服务层函数来执行数据库创建操作。
	// `createComment` 内部会使用传入的 `pb` 实例，这意味着操作将以当前登录用户的身份执行。
	// 服务层通常还会处理 `expand` 等数据关联查询的逻辑。
	const comment = await createComment(pb, createData);

	return {
		message: '发表评论成功',
		data: {
			comment,
		},
	};
});

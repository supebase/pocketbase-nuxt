/**
 * @file API Route: /api/collections/comments [POST]
 * @description 发表评论。集成 XSS 内容清洗、多重业务校验及 Service 层持久化。
 */
import type { Create } from '~/types/pocketbase-types';
import type { CreateCommentRequest } from '~/types/comments';
import { COMMENT_MAX_LENGTH } from '~/constants';
import sanitizeHtml from 'sanitize-html';

export default defineApiHandler(async (event) => {
  // 环境上下文获取 (由 auth 中间件保证 user 存在)
  const pb = event.context.pb;
  const user = event.context.user!;

  // 输入解析与 XSS 深度清洗
  const body = await readBody<CreateCommentRequest>(event);
  const { comment: rawComment, post } = body;

  /**
   * 安全策略：彻底禁止所有 HTML 标签
   * 目的：防止用户提交恶意的 script 或 style 标签执行 XSS 攻击
   */
  const cleanComment = sanitizeHtml(rawComment || '', {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  }).trim();

  // 业务逻辑校验
  if (!post) {
    throw createError({
      status: 400,
      message: '关联的内容 ID 不能为空',
      statusText: 'Bad Request',
    });
  }

  if (!cleanComment) {
    throw createError({
      status: 400,
      message: '评论内容不能为空',
      statusText: 'Bad Request',
    });
  }

  if (cleanComment.length > COMMENT_MAX_LENGTH) {
    throw createError({
      status: 400,
      message: '字数超出上限，请精简内容',
      statusText: 'Bad Request',
    });
  }

  // 数据组装与持久化
  const createData: Create<'comments'> = {
    comment: cleanComment,
    post: post,
    user: user.id,
  };

  // 调用 Service 层：执行创建并自动处理数据关联（Expand User）
  const comment = await createComment({ pb, data: createData });

  return {
    message: '发表评论成功',
    data: {
      comment,
    },
  };
});

import { createComment } from '../../services/comments.service';
import { handlePocketBaseError } from '../../utils/errorHandler';
import { getPocketBaseInstance } from '../../utils/pocketbase'; // 💡 注入实例获取工具
import sanitizeHtml from 'sanitize-html';
// 导入业务类型
import type { CreateCommentRequest } from '~/types/comments';
import type { Create } from '~/types/pocketbase-types';

export default defineEventHandler(async (event) => {
  // 1. 身份验证 (确保 user.id 存在)
  const session = await getUserSession(event);
  const user = session?.user;

  if (!user?.id) {
    throw createError({
      statusCode: 401,
      message: '请先登录后再发表评论',
      statusMessage: 'Unauthorized',
    });
  }

  // 2. 读取请求体并标注类型
  const body = await readBody<CreateCommentRequest>(event);
  const { comment: rawComment, post } = body;

  // 3. 核心防御：清理评论内容（彻底禁止 HTML 标签）
  const cleanComment = sanitizeHtml(rawComment || '', {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  }).trim();

  // 4. 业务参数验证
  if (!post) {
    throw createError({
      statusCode: 400,
      message: '关联的内容 ID 不能为空',
    });
  }

  if (!cleanComment) {
    throw createError({
      statusCode: 400,
      message: '评论内容不能为空',
    });
  }

  // 5. 内容长度限制
  if (cleanComment.length > 300) {
    throw createError({
      statusCode: 400,
      message: '评论内容字数已达上限 (300)',
    });
  }

  // 6. 获取本次请求专用的独立 PB 实例 💡
  const pb = getPocketBaseInstance(event);

  try {
    // 7. 构造符合数据库结构的 Payload
    const createData: Create<'comments'> = {
      comment: cleanComment,
      post: post,
      user: user.id, // 强制使用 Session 中的 ID
    };

    // 8. 执行创建 (传入 pb 实例) 💡
    // Service 内部会使用这个 pb 并自动处理 expand: 'user'
    const comment = await createComment(pb, createData);

    // 9. 统一成功返回格式
    return {
      message: '发表评论成功',
      data: {
        comment,
      },
    };
  } catch (error) {
    return handlePocketBaseError(error, '评论发表异常，请稍后再试');
  }
});
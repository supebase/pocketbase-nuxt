/**
 * @file API Route: /api/collections/post/:id [GET]
 * @description 获取单篇内容（文章）详情的 API 端点。
 */
import { defineApiHandler } from '~~/server/utils/api-wrapper';
import { parseMarkdown } from '@nuxtjs/mdc/runtime';
import type { SinglePostResponse } from '~/types/posts';

/**
 * 定义处理获取单篇文章详情请求的事件处理器。
 */
export default defineApiHandler(async (event): Promise<SinglePostResponse> => {
  // 步骤 1: 从动态路由中获取文章的 ID。
  const postId = getRouterParam(event, 'id');

  // 步骤 2: 对获取到的 ID 进行基础的有效性验证。
  if (!postId) {
    throw createError({
      statusCode: 400,
      message: '文章 ID 无效或未提供',
      statusMessage: 'Invalid Parameter',
    });
  }

  // 步骤 3: 获取本次请求专用的 PocketBase 实例。
  // 实例可以是匿名的，也可以是认证过的，服务层可以根据此来决定数据访问权限。
  const pb = event.context.pb;

  // 步骤 4: 调用服务层的 `getPostById` 函数来执行实际的数据库查询。
  // 传入 `pb` 实例和 `postId`，将具体的查询逻辑与 API 路由解耦。
  const post = await getPostById({ pb, postId });

  // --- 新增：服务端解析 MDC ---
  let mdcAst = null;

  if (post && post.content) {
    try {
      mdcAst = await parseMarkdown(post.content, {
        toc: { depth: 4, searchDepth: 4 },
      });
    } catch (e) {
      console.error('[MDC 解析错误]:', e);
    }
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown';
  // 构造基于文章ID和IP的唯一标识符（去除特殊字符）
  const viewKey = `pv_${postId}_${ip.replace(/[^a-zA-Z0-9]/g, '')}`;
  // 检查是否存在阅读状态的 Cookie
  const hasViewed = getCookie(event, viewKey);

  if (!hasViewed && post) {
    // A. 异步触发 Service 层的自增逻辑 (不使用 await 避免阻塞页面渲染速度)
    incrementPostViews({ pb, postId }).catch((err) => {
      console.error('[Views] 自增失败:', err);
    });

    // B. 设置防止重复计数的 Cookie，有效期 24 小时
    setCookie(event, viewKey, '1', {
      maxAge: 60 * 60 * 24,
      httpOnly: true,
      sameSite: 'lax',
      path: '/', // 确保全站路径可用
    });

    const currentViews = Number(post.views || 0);
    (post as any).views = currentViews + 1;
  }

  return {
    message: '获取内容详情成功',
    data: {
      ...post,
      mdcAst, // 将解析好的 AST 传给前端
    },
  };
});

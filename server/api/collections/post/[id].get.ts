/**
 * @file API Route: /api/collections/post/:id [GET]
 * @description 获取文章详情。集成服务端 MDC 解析、阅读量防刷统计及阅读量异步自增。
 */

import { defineApiHandler } from '~~/server/utils/api-wrapper';
import { parseMarkdown } from '@nuxtjs/mdc/runtime';
import type { SinglePostResponse } from '~/types/posts';
import { MAX_VIEW_COOKIE_AGE } from '~/constants';

export default defineApiHandler(async (event): Promise<SinglePostResponse> => {
  const { pb } = event.context;
  const postId = getRouterParam(event, 'id');

  // 参数验证
  if (!postId) {
    throw createError({
      statusCode: 400,
      message: '内容 ID 无效或未提供',
    });
  }

  // 调用 Service 层获取原始记录
  const post = await getPostById({ pb, postId });

  // 服务端 MDC 预解析：将 Markdown 转换为 AST 以提升前端渲染速度
  let mdcAst = null;
  if (post?.content) {
    try {
      mdcAst = await parseMarkdown(post.content, {
        toc: { depth: 4, searchDepth: 4 },
      });
    } catch (e) {
      console.error(`[MDC Error] 路径: ${postId}`, e);
    }
  }

  // 阅读量防刷逻辑 (IP + Cookie 24h 锁定策略)
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown';
  const viewKey = `pv_${postId}_${ip.replace(/[^a-zA-Z0-9]/g, '')}`;
  const hasViewed = getCookie(event, viewKey);

  if (!hasViewed && post) {
    /**
     * 非阻塞自增：不使用 await，让阅读量在后台静默更新，不干扰页面首屏响应速度。
     */
    incrementPostViews({ pb, postId }).catch((err) => {
      console.error('[Views] 自增失败:', err);
    });

    /**
     * 设置防刷标识：24 小时内同一 IP 访问该文章不再计入阅读量
     */
    setCookie(event, viewKey, '1', {
      maxAge: MAX_VIEW_COOKIE_AGE,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    // 内存数据同步：让当前请求返回的数据即时反映出自增后的数值
    (post as any).views = Number(post.views || 0) + 1;
  }

  // 返回标准化响应：携带 AST 内容
  return {
    message: '获取内容详情成功',
    data: {
      ...post,
      mdcAst,
    },
  };
});

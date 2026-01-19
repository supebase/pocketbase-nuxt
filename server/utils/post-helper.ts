import { parseMarkdown } from '@nuxtjs/mdc/runtime';
import { MAX_VIEW_COOKIE_AGE } from '~/constants';
import type { H3Event } from 'h3';

/**
 * 简化 MDC 语法树，去除冗余的位置信息
 */
export const simplifyAst = (node: any) => {
  if (Array.isArray(node)) {
    node.forEach(simplifyAst);
  } else if (node && typeof node === 'object') {
    delete node.position;
    if (node.children) simplifyAst(node.children);
  }
  return node;
};

/**
 * 处理阅读量防刷与异步自增逻辑
 * @returns 返回即时更新后的阅读量数值
 */
export const handlePostViewTracking = async (event: H3Event, post: any) => {
  if (!post) return 0;

  const postId = post.id;
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown';
  // 移除 IP 中的特殊字符作为 Cookie Key
  const viewKey = `pv_${postId}_${ip.replace(/[^a-zA-Z0-9]/g, '')}`;
  const hasViewed = getCookie(event, viewKey);

  let currentViews = Number(post.views || 0);

  if (!hasViewed) {
    // 1. 非阻塞后台更新
    incrementPostViews({ pb: event.context.pb, postId }).catch((err) => {
      console.error(`[Views] 自增失败 (ID: ${postId}):`, err);
    });

    // 2. 设置 24h 防刷 Cookie
    setCookie(event, viewKey, '1', {
      maxAge: MAX_VIEW_COOKIE_AGE,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    // 3. 内存数据即时响应
    currentViews += 1;
  }

  return currentViews;
};

/**
 * 服务端解析 Markdown 为简化后的 AST
 */
export const getProcessedAst = async (content: string, id: string) => {
  try {
    const result = await parseMarkdown(content, {
      toc: { depth: 4, searchDepth: 4 },
    });
    return simplifyAst(result);
  } catch (e) {
    console.error(`[MDC Error] ID: ${id}`, e);
    return null;
  }
};

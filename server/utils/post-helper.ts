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
  const VIEW_LIST_KEY = 'v_list';

  // 获取并清洗数据：filter(Boolean) 移除 split 产生的空字符串项
  const viewListStr = getCookie(event, VIEW_LIST_KEY) || '';
  const viewedIds = viewListStr.split(',').filter(Boolean);

  let currentViews = Number(post.views || 0);

  // 检查是否包含当前 ID
  if (!viewedIds.includes(postId)) {
    // 压入新 ID
    viewedIds.push(postId);

    // 滚动窗口：限制存储最近的 20 条记录，防止 Cookie 过大
    const updatedIds = viewedIds.slice(-20);

    // 写回 Cookie
    setCookie(event, VIEW_LIST_KEY, updatedIds.join(','), {
      maxAge: MAX_VIEW_COOKIE_AGE,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    // 异步自增（非阻塞）
    incrementPostViews({ pb: event.context.pb, postId }).catch((err) => {
      console.error(`[Views] 自增失败 (ID: ${postId}):`, err);
    });

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

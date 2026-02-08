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
/**
 * 处理阅读量防刷与异步自增逻辑
 * @returns 返回即时更新后的阅读量数值
 */
export const handlePostViewTracking = async (event: H3Event, post: any) => {
  if (!post) return 0;

  const postId = post.id;
  const VIEW_LIST_KEY = 'v_list';

  // 1. 读取并解析已阅列表
  const viewListStr = getCookie(event, VIEW_LIST_KEY) || '';
  const viewedIds = viewListStr.split(',').filter(Boolean);

  let currentViews = Number(post.views || 0);

  // 2. 判定是否为新阅读
  if (!viewedIds.includes(postId)) {
    // 内存中立即 +1，确保本次 API 返回的值是最新的
    currentViews += 1;

    // 限制 Cookie 长度（保留最近 20 条），防止请求头过大导致 431 错误
    const updatedIds = [...viewedIds, postId].slice(-20);

    // 3. 同步写回 Cookie
    setCookie(event, VIEW_LIST_KEY, updatedIds.join(','), {
      maxAge: MAX_VIEW_COOKIE_AGE,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    /**
     * 4. 异步更新数据库（非阻塞）
     * 不使用 await，让请求立即向下执行，但在后台处理错误
     */
    const pb = event.context.pb;

    if (pb) {
      // 启动一个后台 Promise
      incrementPostViews({ pb, postId })
        .then(() => {
          // 可以在这里打个 debug 日志：console.log(`[Views] Success: ${postId}`)
        })
        .catch((err) => {
          // 这里的错误捕获至关重要，防止未捕获的异常导致 Node 进程不稳
          console.error(`[Views Update Error] ID: ${postId} -`, err.message);
        });
    }
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
    // console.error(`[MDC Error] ID: ${id}`, e);
    return null;
  }
};

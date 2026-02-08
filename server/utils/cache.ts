/**
 * 清除指定模式的所有缓存
 * @param pattern - 缓存键的模式，支持通配符
 */
export async function invalidateCache(pattern: string) {
  const storage = useStorage('cache');
  const keys = await storage.getKeys();

  if (!keys.length) return;

  // 1. 先转义所有正则特殊字符（包括星号本身）
  // 这会将 "*" 变成 "\*"
  const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 2. 将已经转义的 "\*" 替换为正则表达式中的通配符 ".*"
  const regex = new RegExp('^' + escapedPattern.replace(/\\\*/g, '.*') + '$');
  const keysToDelete = keys.filter((key) => regex.test(key));

  if (keysToDelete.length > 0) {
    // 使用 allSettled。即使某个 Key 在 getKeys 和 removeItem 之间过期了，
    // 也不会导致整个函数抛出异常从而影响你的业务流程。
    await Promise.allSettled(keysToDelete.map((key) => storage.removeItem(key)));
  }
}

/**
 * 清除文章相关的所有缓存
 */
export async function invalidatePostCaches(postId?: string) {
  if (postId) {
    // 清除特定文章的缓存
    await invalidateCache(`*:getPostById:${postId}*`);
  }
  // 清除列表缓存（因为列表中也包含该文章）
  await invalidateCache('*:getPostsList:*');
}

/**
 * 清除评论相关的所有缓存
 * @param commentId - 可选，特定评论 ID
 * @param postId - 可选，特定文章 ID（建议加上这个参数）
 */
export async function invalidateCommentCaches(commentId?: string, postId?: string) {
  if (commentId) {
    await invalidateCache(`*:getCommentById:${commentId}*`);
  }

  if (postId) {
    // 仅清除该文章下的评论列表缓存
    await invalidateCache(`*:getCommentsList:*post=${postId}*`);
  } else {
    // 如果没传 postId，才保守地清除所有评论列表
    await invalidateCache('*:getCommentsList:*');
  }
}

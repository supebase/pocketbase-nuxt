/**
 * 清除指定模式的所有缓存
 * @param pattern - 缓存键的模式，支持通配符
 */
export async function invalidateCache(pattern: string) {
  const storage = useStorage('cache');
  const keys = await storage.getKeys();

  // 1. 先转义所有正则特殊字符（包括星号本身）
  // 这会将 "*" 变成 "\*"
  const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 2. 将已经转义的 "\*" 替换为正则表达式中的通配符 ".*"
  const regexString = '^' + escapedPattern.replace(/\\\*/g, '.*') + '$';
  const regex = new RegExp(regexString);

  const keysToDelete = keys.filter((key) => regex.test(key));

  if (keysToDelete.length > 0) {
    // 建议：缓存清理可以不使用 await，或者捕获错误防止阻塞主流程
    await Promise.all(keysToDelete.map((key) => storage.removeItem(key)));
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

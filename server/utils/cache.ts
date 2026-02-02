/**
 * 清除指定模式的所有缓存
 * @param pattern - 缓存键的模式，支持通配符
 */
export async function invalidateCache(pattern: string) {
  const storage = useStorage('cache');
  const keys = await storage.getKeys();

  const keysToDelete = keys.filter((key) => {
    // 将模式转换为正则表达式
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(key);
  });

  await Promise.all(keysToDelete.map((key) => storage.removeItem(key)));
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
 */
export async function invalidateCommentCaches(commentId?: string) {
  if (commentId) {
    // 清除特定评论的详情缓存
    await invalidateCache(`*:getCommentById:${commentId}*`);
  }
  // 清除评论列表缓存（因为发表新评论或删除都会改变列表）
  await invalidateCache('*:getCommentsList:*');
}

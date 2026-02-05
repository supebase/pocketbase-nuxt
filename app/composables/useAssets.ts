/**
 * @description 资源路径处理工具
 * 用于前端不直接连接 PB，而是通过后端 /api/images 代理获取图片的场景
 */
export const useAssets = () => {
  /**
   * 获取 Post 相关图片的代理路径
   * @param collection 集合名称，如 'posts' 或 'users'
   * @param recordId 记录的 ID
   * @param fileName 文件名字段的值
   */
  const getImageUrl = (collection: string, recordId: string, fileName: string | undefined) => {
    if (!fileName || !recordId) return '';
    // 拼接后端代理路由: /api/images/[collection]/[id]/[filename]
    return `/api/images/${collection}/${recordId}/${fileName}`;
  };

  /**
   * 快捷获取文章相关图片 (link_image 或 将来的上传头像)
   */
  const getLinkImage = (post: any, fileName: string | undefined) => {
    return getImageUrl('posts', post.id, fileName);
  };

  const getUserAvatar = (userId: string | undefined, fileName: string | undefined) => {
    return getImageUrl('_pb_users_auth_', userId || '', fileName);
  };

  return {
    getImageUrl,
    getLinkImage,
    getUserAvatar,
  };
};

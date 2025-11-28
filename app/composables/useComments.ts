import type { ClientResponseError } from "pocketbase";
import type { CommentModel, CreateCommentRequest } from "~/types/comment";
import type { ApiResponse } from "~/types/user";

export const useComments = () => {
  // 获取 PocketBase 客户端单例
  const { pbClient } = usePocketbase();
  // 获取错误处理函数
  const { handlePbError } = useErrorHandler();
  // 获取认证状态
  const { currentUser } = useAuth();

  /**
   * 发布评论
   * @param data 创建评论的数据
   * @returns {Promise<ApiResponse<CommentModel>>} 成功返回评论记录，失败返回错误对象
   */
  const createComment = async (data: CreateCommentRequest): Promise<ApiResponse<CommentModel>> => {
    try {
      // 检查用户是否已登录且已验证
      if (!currentUser.value || !currentUser.value.verified) {
        return {
          isError: true,
          message: "只有已验证的用户才能发布评论"
        };
      }

      // 创建评论
      const comment = await pbClient.collection("comments").create({
        ...data,
        user: currentUser.value.id
      });

      return comment as unknown as CommentModel;
    } catch (e) {
      const error = e as ClientResponseError;
      return handlePbError(error, "发布评论失败");
    }
  };

  /**
   * 获取文章的评论列表
   * @param postId 文章ID
   * @returns {Promise<ApiResponse<CommentModel[]>>} 成功返回评论列表，失败返回错误对象
   */
  const getCommentsByPostId = async (postId: string): Promise<ApiResponse<CommentModel[]>> => {
    try {
      // 获取评论列表，包含用户信息
      const comments = await pbClient.collection("comments").getFullList({
        filter: `post = "${postId}"`,
        expand: "user",
        sort: "-created"
      });

      return comments as unknown as CommentModel[];
    } catch (e) {
      const error = e as ClientResponseError;
      return handlePbError(error, "获取评论列表失败");
    }
  };

  /**
   * 删除评论
   * @param id 评论ID
   * @returns {Promise<ApiResponse<boolean>>} 成功返回true，失败返回错误对象
   */
  const deleteComment = async (id: string): Promise<ApiResponse<boolean>> => {
    try {
      // 检查用户是否已登录
      if (!currentUser.value) {
        return {
          isError: true,
          message: "请先登录"
        };
      }

      // 获取评论详情
      const comment = await pbClient.collection("comments").getOne(id, {
        expand: "user"
      });

      // 检查是否是评论作者或已验证用户
      // comment.user 现在是字符串ID，直接比较
      if (comment.user !== currentUser.value.id && !currentUser.value.verified) {
        return {
          isError: true,
          message: "只有评论作者或已验证用户才能删除评论"
        };
      }

      // 删除评论
      await pbClient.collection("comments").delete(id);

      return true;
    } catch (e) {
      const error = e as ClientResponseError;
      return handlePbError(error, "删除评论失败");
    }
  };

  return {
    createComment,
    getCommentsByPostId,
    deleteComment
  };
};

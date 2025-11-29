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
      // 检查用户是否已登录
      if (!currentUser.value) {
        return {
          isError: true,
          message: "请先登录"
        };
      }

      // 创建评论
      const comment = await pbClient.collection("comments").create<CommentModel>({
        ...data,
        user: currentUser.value.id
      });

      return comment;
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
      const comments = await pbClient.collection("comments").getFullList<CommentModel>({
        // 使用官方推荐的 pb.filter() 方法安全绑定参数
        filter: pbClient.filter('post = {:postId}', { postId }),
        expand: "user",
        sort: "-created"
      });

      return comments;
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
      const comment = await pbClient.collection("comments").getOne<CommentModel>(id, {
        expand: "user"
      });

      // 检查是否是评论作者
      if (comment.user !== currentUser.value.id) {
        return {
          isError: true,
          message: "只有评论作者才能删除评论"
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

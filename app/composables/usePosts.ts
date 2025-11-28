import type { ClientResponseError } from "pocketbase";
import type { PostModel, CreatePostRequest, UpdatePostRequest } from "~/types/post";
import type { ApiResponse } from "~/types/user";

export const usePosts = () => {
  // 获取 PocketBase 客户端单例
  const { pbClient } = usePocketbase();
  // 获取错误处理函数
  const { handlePbError } = useErrorHandler();
  // 获取认证状态
  const { currentUser } = useAuth();

  /**
   * 发布文章
   * @param data 创建文章的数据
   * @returns {Promise<ApiResponse<PostModel>>} 成功返回文章记录，失败返回错误对象
   */
  const createPost = async (data: CreatePostRequest): Promise<ApiResponse<PostModel>> => {
    try {
      // 检查用户是否已登录且已验证
      if (!currentUser.value || !currentUser.value.verified) {
        return {
          isError: true,
          message: "只有已验证的用户才能发布文章"
        };
      }

      // 创建文章
      const post = await pbClient.collection("posts").create({
        ...data,
        user: currentUser.value.id
      });

      return post as unknown as PostModel;
    } catch (e) {
      const error = e as ClientResponseError;
      return handlePbError(error, "发布文章失败");
    }
  };

  /**
   * 获取文章列表
   * @returns {Promise<ApiResponse<PostModel[]>>} 成功返回文章列表，失败返回错误对象
   */
  const getPosts = async (): Promise<ApiResponse<PostModel[]>> => {
    try {
      // 获取文章列表，包含用户信息
      const posts = await pbClient.collection("posts").getFullList({
        expand: "user",
        sort: "-created"
      });

      return posts as unknown as PostModel[];
    } catch (e) {
      const error = e as ClientResponseError;
      return handlePbError(error, "获取文章列表失败");
    }
  };

  /**
   * 获取文章详情
   * @param id 文章ID
   * @returns {Promise<ApiResponse<PostModel>>} 成功返回文章详情，失败返回错误对象
   */
  const getPostById = async (id: string): Promise<ApiResponse<PostModel>> => {
    try {
      // 获取文章详情，包含用户信息
      const post = await pbClient.collection("posts").getOne(id, {
        expand: "user"
      });

      return post as unknown as PostModel;
    } catch (e) {
      const error = e as ClientResponseError;
      return handlePbError(error, "获取文章详情失败");
    }
  };

  /**
   * 更新文章
   * @param id 文章ID
   * @param data 更新文章的数据
   * @returns {Promise<ApiResponse<PostModel>>} 成功返回更新后的文章，失败返回错误对象
   */
  const updatePost = async (id: string, data: UpdatePostRequest): Promise<ApiResponse<PostModel>> => {
    try {
      // 检查用户是否已登录且已验证
      if (!currentUser.value || !currentUser.value.verified) {
        return {
          isError: true,
          message: "只有已验证的用户才能编辑文章"
        };
      }

      // 获取文章详情
      const post = await getPostById(id);
      if ("isError" in post) {
        return post;
      }

      // 检查是否是文章作者
      // post.user 现在是字符串ID，直接比较
      if (post.user !== currentUser.value.id) {
        return {
          isError: true,
          message: "只有文章作者才能编辑文章"
        };
      }

      // 更新文章
      const updatedPost = await pbClient.collection("posts").update(id, data);

      return updatedPost as unknown as PostModel;
    } catch (e) {
      const error = e as ClientResponseError;
      return handlePbError(error, "更新文章失败");
    }
  };

  /**
   * 删除文章
   * @param id 文章ID
   * @returns {Promise<ApiResponse<boolean>>} 成功返回true，失败返回错误对象
   */
  const deletePost = async (id: string): Promise<ApiResponse<boolean>> => {
    try {
      // 检查用户是否已登录且已验证
      if (!currentUser.value || !currentUser.value.verified) {
        return {
          isError: true,
          message: "只有已验证的用户才能删除文章"
        };
      }

      // 获取文章详情
      const post = await getPostById(id);
      if ("isError" in post) {
        return {
          isError: true,
          message: post.message
        };
      }

      // 检查是否是文章作者
      // post.user 现在是字符串ID，直接比较
      if (post.user !== currentUser.value.id) {
        return {
          isError: true,
          message: "只有文章作者才能删除文章"
        };
      }

      // 删除文章
      await pbClient.collection("posts").delete(id);

      return true;
    } catch (e) {
      const error = e as ClientResponseError;
      return handlePbError(error, "删除文章失败");
    }
  };

  return {
    createPost,
    getPosts,
    getPostById,
    updatePost,
    deletePost
  };
};

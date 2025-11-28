import type { BaseModel } from "pocketbase";
import type { UserModel } from "./user";
import type { PostModel } from "./post";

/**
 * 评论模型类型定义
 */
export interface CommentModel extends BaseModel {
  // 评论内容
  comment: string;
  // 关联的用户ID
  user: string;
  // 关联的文章ID
  post: string;
  // 扩展字段，包含关联的对象
  expand?: {
    user?: UserModel;
    post?: PostModel;
  };
  // 创建时间
  created: string;
  // 更新时间
  updated: string;
}

/**
 * 创建评论的请求类型
 */
export interface CreateCommentRequest {
  comment: string;
  post: string;
}

import type { BaseModel } from "pocketbase";
import type { UserModel } from "./user";

/**
 * 文章模型类型定义
 */
export interface PostModel extends BaseModel {
  // 文章标题
  title: string;
  // 文章内容
  content: string;
  // 关联的用户ID
  user: string;
  // 扩展字段，包含关联的用户对象
  expand?: {
    user?: UserModel;
  };
  // 创建时间
  created: string;
  // 更新时间
  updated: string;
}

/**
 * 创建文章的请求类型
 */
export interface CreatePostRequest {
  title: string;
  content: string;
}

/**
 * 更新文章的请求类型
 */
export interface UpdatePostRequest {
  title: string;
  content: string;
}

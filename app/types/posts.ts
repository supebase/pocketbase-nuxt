/**
 * 文章相关类型定义
 */

/**
 * 文章记录类型
 */
export interface PostRecord {
  id: string;
  content: string;
  allow_comment: boolean;
  published: boolean;
  icon?: string;
  action?: string;
  created: string;
  relativeTime?: string; // 相对时间，用于前端显示
  expand?: {
    user?: {
      name?: string;
      verified?: boolean;
      avatar?: string;
    };
  };
}

/**
 * 文章列表响应类型
 */
export interface PostsResponse {
  message: string;
  data: {
    posts: PostRecord[];
    totalItems: number;
    page: number;
    perPage: number;
  };
}

/**
 * 单篇文章响应类型
 */
export interface PostResponse {
  message: string;
  data: PostRecord;
}

/**
 * 创建文章请求类型
 */
export interface CreatePostRequest {
  content: string;
  allow_comment: boolean;
  published: boolean;
  icon?: string;
  action?: string;
}

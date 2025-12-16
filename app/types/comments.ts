/**
 * 评论相关类型定义
 */

/**
 * 评论记录类型
 */
export interface CommentRecord {
  id: string;
  comment: string;
  created: string;
  relativeTime?: string; // 相对时间，用于前端显示
  expand?: {
    post?: {
      id?: string;
      content?: string;
    };
    user?: {
      name?: string;
      verified?: boolean;
      avatar?: string;
    };
  };
}

/**
 * 评论列表响应类型
 */
export interface CommentsResponse {
  message: string;
  data: {
    comments: CommentRecord[];
    totalItems: number;
    page: number;
    perPage: number;
  };
}

/**
 * 创建评论请求类型
 */
export interface CreateCommentRequest {
  comment: string;
  post: string;
}

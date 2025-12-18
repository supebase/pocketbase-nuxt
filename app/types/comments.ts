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
  likes?: number; // 点赞数
  isLiked?: boolean; // 当前用户是否已点赞
  isNew?: boolean; // 是否是刚发表的评论
  initialized?: boolean; // 是否已初始化，用于动画效果
  expand?: {
    post?: {
      id?: string;
      content?: string;
    };
    user?: {
      id?: string;
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

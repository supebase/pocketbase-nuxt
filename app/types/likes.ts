/**
 * 点赞相关类型定义
 */

/**
 * 点赞记录类型
 */
export interface LikeRecord {
  id: string;
  user: string;
  comment: string;
  created: string;
}

/**
 * 点赞请求类型
 */
export interface ToggleLikeRequest {
  comment: string;
}

/**
 * 点赞响应类型
 */
export interface ToggleLikeResponse {
  message: string;
  data: {
    liked: boolean;
    likes: number;
    commentId: string;
  };
}

/**
 * 评论点赞数请求类型
 */
export interface CommentLikesRequest {
  commentIds: string[];
}

/**
 * 单个评论点赞信息
 */
export interface CommentLikeInfo {
  commentId: string;
  likes: number;
  isLiked: boolean;
}

/**
 * 评论点赞数响应类型
 */
export interface CommentLikesResponse {
  message: string;
  data: {
    likesMap: Record<string, CommentLikeInfo>;
  };
}
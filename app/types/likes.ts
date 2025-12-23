import type { LikesResponse as PBLikeResponse } from './pocketbase-types';

export interface LikeRecord extends PBLikeResponse {}

export interface ToggleLikeRequest {
  comment: string;
}

export interface ToggleLikeResponse {
  message: string;
  data: {
    liked: boolean;
    likes: number;
    commentId: string;
  };
}

export interface CommentLikeInfo {
  commentId: string;
  likes: number;
  isLiked: boolean;
}

export interface CommentLikesResponse {
  message: string;
  data: {
    likesMap: Record<string, CommentLikeInfo>;
  };
}

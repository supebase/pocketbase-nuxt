import type {
  CommentsResponse as PBCommentResponse,
  UsersResponse,
  PostsResponse,
} from './pocketbase-types';

export interface CommentExpand {
  user?: Pick<UsersResponse, 'id' | 'name' | 'verified' | 'avatar' | 'location'>;
  post?: Pick<PostsResponse, 'id' | 'content'>;
}

export interface CommentRecord extends PBCommentResponse<CommentExpand> {
  relativeTime?: string | ComputedRef<string>;
  likes?: number;
  isLiked?: boolean;
  isNew?: boolean;
  initialized?: boolean;
}

export interface CommentsListResponse {
  message: string;
  data: {
    comments: CommentRecord[];
    totalItems: number;
    page: number;
    perPage: number;
  };
}

export interface CreateCommentRequest {
  comment: string;
  post: string;
}

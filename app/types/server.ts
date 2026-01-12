import type { Create, TypedPocketBase } from './pocketbase-types';
import type { CreatePostRequest } from './posts';
import type { H3Event } from 'h3';

/**
 * Service 层配置对象
 */
export interface LoginOptions {
  pb: TypedPocketBase;
  email: string;
  password: string;
}

export interface RegisterOptions extends LoginOptions {
  passwordConfirm: string;
  location: string;
}

export interface LogoutOptions {
  event: H3Event;
  pb: TypedPocketBase;
}

export interface GetPostsOptions {
  pb: TypedPocketBase;
  page?: number;
  perPage?: number;
  query?: string;
}

export interface GetPostByIdOptions {
  pb: TypedPocketBase;
  postId: string;
}

export interface CreatePostOptions {
  pb: TypedPocketBase;
  initialData: FormData;
  rawContent: string;
}

export interface UpdatePostOptions {
  pb: TypedPocketBase;
  postId: string;
  body: Partial<CreatePostRequest> & Record<string, any>;
}

export interface DeletePostOptions {
  pb: TypedPocketBase;
  postId: string;
}

export interface GetCommentsOptions {
  pb: TypedPocketBase;
  page?: number;
  perPage?: number;
  filter?: string;
  userId?: string;
}

export interface GetCommentByIdOptions {
  pb: TypedPocketBase;
  commentId: string;
}

export interface CreateCommentOptions {
  pb: TypedPocketBase;
  data: Create<'comments'>;
}

export interface DeleteCommentOptions {
  pb: TypedPocketBase;
  commentId: string;
}

export interface ToggleLikeOptions {
  pb: TypedPocketBase;
  commentId: string;
  userId: string;
}

export interface GetCommentLikesOptions {
  pb: TypedPocketBase;
  commentId: string;
}

export interface GetCommentsLikesMapOptions {
  pb: TypedPocketBase;
  commentIds: string[];
  userId?: string;
}

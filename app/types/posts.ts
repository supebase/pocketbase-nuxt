import type { PostsResponse as PBPostResponse, UsersResponse } from './pocketbase-types';

/**
 * 扩展 Expand 类型定义
 */
export interface PostExpand {
  user?: Pick<UsersResponse, 'name' | 'verified' | 'avatar'>;
}

/**
 * 业务文章记录：继承自 PB 自动生成的 Response
 */
export interface PostRecord extends PBPostResponse<PostExpand> {
  relativeTime?: string; // 仅前端展示使用
}

export interface PostsListResponse {
  message: string;
  data: {
    posts: PostRecord[];
    totalItems: number;
    page: number;
    perPage: number;
  };
}

export interface SinglePostResponse {
  message: string;
  data: PostRecord;
}

// 创建请求可以直接使用 Pick
export type CreatePostRequest = Pick<
  PBPostResponse,
  'content' | 'allow_comment' | 'published' | 'icon' | 'action' | 'link' | 'link_data'
>;

export interface LinkPreviewData {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
  favicon: string;
}

export type PostWithUser = PBPostResponse<{ user: UsersResponse }> & {
  cleanContent?: string;
};

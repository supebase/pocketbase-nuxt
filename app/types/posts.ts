import type { PostsResponse as PBPostResponse, UsersResponse } from './pocketbase-types';

/**
 * 1. 扩展 Expand 类型定义
 */
export interface PostExpand {
  user?: Pick<UsersResponse, 'name' | 'verified' | 'avatar'>;
}

/**
 * 2. 基础 UI 扩展接口 (提取公共部分)
 */
interface PostUIExtension {
  cleanContent?: string;
  firstImage?: string | null;
  _processed?: boolean;
  ui?: {
    date: string;
    userName: string;
    avatarId?: string;
  };
}

/**
 * 3. 业务文章记录 (用于 API 返回值)
 */
export interface PostRecord extends PBPostResponse<PostExpand>, PostUIExtension {
  relativeTime?: string;
  mdcAst?: any;
}

/**
 * 4. 列表展示专用类型 (用于 usePosts 和全局状态)
 */
export type PostWithUser = PBPostResponse<{ user: UsersResponse }> &
  PostUIExtension & {
    link_data?: LinkPreviewData | null;
    expand?: {
      user?: UsersResponse;
    };
  };

// --- 其他保持不变 ---
export interface PostsListResponse {
  message: string;
  data: { posts: PostRecord[]; totalItems: number; page: number; perPage: number };
}

export interface SinglePostResponse {
  message: string;
  data: PostRecord;
}

export type CreatePostRequest = Pick<
  PBPostResponse,
  | 'content'
  | 'allow_comment'
  | 'published'
  | 'poll'
  | 'reactions'
  | 'icon'
  | 'action'
  | 'link'
  | 'link_data'
  | 'link_image'
  | 'views'
>;

export interface LinkPreviewData {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
}

export interface PostItem {
  id: string | number;
  [key: string]: any;
}

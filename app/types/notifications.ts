import type { NotificationsResponse, UsersResponse, PostsResponse, CommentsResponse } from './pocketbase-types';

/**
 * 通知记录的展开字段定义
 */
export interface NotificationExpand {
  from_user: UsersResponse;
  post: PostsResponse;
  comment: CommentsResponse;
}

export interface NotificationsApiResult {
  items: NotificationRecord[];
  totalPages: number;
  totalItems: number;
  page: number;
  perPage: number;
}

/**
 * 完整的通知响应类型
 */
export type NotificationRecord = NotificationsResponse<NotificationExpand>;

/**
 * This file was @generated using pocketbase-typegen
 */

import type PocketBase from 'pocketbase';
import type { RecordService } from 'pocketbase';

export enum Collections {
  Authorigins = '_authOrigins',
  Externalauths = '_externalAuths',
  Mfas = '_mfas',
  Otps = '_otps',
  Superusers = '_superusers',
  CommentLikeCounts = 'comment_like_counts',
  CommentStats = 'comment_stats',
  Comments = 'comments',
  Likes = 'likes',
  Notifications = 'notifications',
  Posts = 'posts',
  UserStats = 'user_stats',
  Users = 'users',
}

// Alias types for improved usability
export type IsoDateString = string;
export type IsoAutoDateString = string & { readonly autodate: unique symbol };
export type RecordIdString = string;
export type FileNameString = string & { readonly filename: unique symbol };
export type HTMLString = string;

type ExpandType<T> = unknown extends T ? (T extends unknown ? { expand?: unknown } : { expand: T }) : { expand: T };

// System fields
export type BaseSystemFields<T = unknown> = {
  id: RecordIdString;
  collectionId: string;
  collectionName: Collections;
} & ExpandType<T>;

export type AuthSystemFields<T = unknown> = {
  email: string;
  emailVisibility: boolean;
  username: string;
  verified: boolean;
} & BaseSystemFields<T>;

// Record types for each collection

export type AuthoriginsRecord = {
  collectionRef: string;
  created: IsoAutoDateString;
  fingerprint: string;
  id: string;
  recordRef: string;
  updated: IsoAutoDateString;
};

export type ExternalauthsRecord = {
  collectionRef: string;
  created: IsoAutoDateString;
  id: string;
  provider: string;
  providerId: string;
  recordRef: string;
  updated: IsoAutoDateString;
};

export type MfasRecord = {
  collectionRef: string;
  created: IsoAutoDateString;
  id: string;
  method: string;
  recordRef: string;
  updated: IsoAutoDateString;
};

export type OtpsRecord = {
  collectionRef: string;
  created: IsoAutoDateString;
  id: string;
  password: string;
  recordRef: string;
  sentTo?: string;
  updated: IsoAutoDateString;
};

export type SuperusersRecord = {
  created: IsoAutoDateString;
  email: string;
  emailVisibility?: boolean;
  id: string;
  password: string;
  tokenKey: string;
  updated: IsoAutoDateString;
  verified?: boolean;
};

export type CommentLikeCountsRecord = {
  id: string;
  likes?: number;
};

export type CommentStatsRecord<Tlast_user_name = unknown, Tuser_avatars = unknown> = {
  id: string;
  last_user_name?: null | Tlast_user_name;
  post?: RecordIdString;
  total_items?: number;
  user_avatars?: null | Tuser_avatars;
};

export type CommentsRecord = {
  comment?: string;
  created: IsoAutoDateString;
  id: string;
  post?: RecordIdString;
  updated?: IsoAutoDateString;
  user?: RecordIdString;
};

export type LikesRecord = {
  comment?: RecordIdString;
  created: IsoAutoDateString;
  id: string;
  updated?: IsoAutoDateString;
  user?: RecordIdString;
};

export enum NotificationsTypeOptions {
  'mention' = 'mention',
}
export type NotificationsRecord = {
  comment?: RecordIdString;
  created: IsoAutoDateString;
  from_user?: RecordIdString;
  id: string;
  is_read?: boolean;
  post?: RecordIdString;
  to_user?: RecordIdString;
  type?: NotificationsTypeOptions;
  updated: IsoAutoDateString;
};

export enum PostsActionOptions {
  'dit' = 'dit',
  'partager' = 'partager',
}
export type PostsRecord<Tlink_data = unknown> = {
  action?: PostsActionOptions;
  allow_comment?: boolean;
  content?: string;
  created: IsoAutoDateString;
  icon?: string;
  id: string;
  link?: string;
  link_data?: null | Tlink_data;
  link_image?: FileNameString;
  markdown_images?: FileNameString[];
  poll?: boolean;
  published?: boolean;
  reactions?: boolean;
  updated?: IsoAutoDateString;
  user?: RecordIdString;
  views?: number;
};

export type UserStatsRecord<Tactive_users_30d = unknown, Ttoday_new_users = unknown> = {
  active_users_30d?: null | Tactive_users_30d;
  id: string;
  today_new_users?: null | Ttoday_new_users;
  total_users?: number;
};

export type UsersRecord = {
  avatar?: string;
  created: IsoAutoDateString;
  email: string;
  emailVisibility?: boolean;
  id: string;
  location?: string;
  name?: string;
  password: string;
  tokenKey: string;
  updated?: IsoAutoDateString;
  verified?: boolean;
};

// Response types include system fields and match responses from the PocketBase API
export type AuthoriginsResponse<Texpand = unknown> = Required<AuthoriginsRecord> & BaseSystemFields<Texpand>;
export type ExternalauthsResponse<Texpand = unknown> = Required<ExternalauthsRecord> & BaseSystemFields<Texpand>;
export type MfasResponse<Texpand = unknown> = Required<MfasRecord> & BaseSystemFields<Texpand>;
export type OtpsResponse<Texpand = unknown> = Required<OtpsRecord> & BaseSystemFields<Texpand>;
export type SuperusersResponse<Texpand = unknown> = Required<SuperusersRecord> & AuthSystemFields<Texpand>;
export type CommentLikeCountsResponse<Texpand = unknown> = Required<CommentLikeCountsRecord> &
  BaseSystemFields<Texpand>;
export type CommentStatsResponse<Tlast_user_name = unknown, Tuser_avatars = unknown, Texpand = unknown> = Required<
  CommentStatsRecord<Tlast_user_name, Tuser_avatars>
> &
  BaseSystemFields<Texpand>;
export type CommentsResponse<Texpand = unknown> = Required<CommentsRecord> & BaseSystemFields<Texpand>;
export type LikesResponse<Texpand = unknown> = Required<LikesRecord> & BaseSystemFields<Texpand>;
export type NotificationsResponse<Texpand = unknown> = Required<NotificationsRecord> & BaseSystemFields<Texpand>;
export type PostsResponse<Tlink_data = unknown, Texpand = unknown> = Required<PostsRecord<Tlink_data>> &
  BaseSystemFields<Texpand>;
export type UserStatsResponse<Tactive_users_30d = unknown, Ttoday_new_users = unknown, Texpand = unknown> = Required<
  UserStatsRecord<Tactive_users_30d, Ttoday_new_users>
> &
  BaseSystemFields<Texpand>;
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>;

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
  _authOrigins: AuthoriginsRecord;
  _externalAuths: ExternalauthsRecord;
  _mfas: MfasRecord;
  _otps: OtpsRecord;
  _superusers: SuperusersRecord;
  comment_like_counts: CommentLikeCountsRecord;
  comment_stats: CommentStatsRecord;
  comments: CommentsRecord;
  likes: LikesRecord;
  notifications: NotificationsRecord;
  posts: PostsRecord;
  user_stats: UserStatsRecord;
  users: UsersRecord;
};

export type CollectionResponses = {
  _authOrigins: AuthoriginsResponse;
  _externalAuths: ExternalauthsResponse;
  _mfas: MfasResponse;
  _otps: OtpsResponse;
  _superusers: SuperusersResponse;
  comment_like_counts: CommentLikeCountsResponse;
  comment_stats: CommentStatsResponse;
  comments: CommentsResponse;
  likes: LikesResponse;
  notifications: NotificationsResponse;
  posts: PostsResponse;
  user_stats: UserStatsResponse;
  users: UsersResponse;
};

// Utility types for create/update operations

type ProcessCreateAndUpdateFields<T> = Omit<
  {
    // Omit AutoDate fields
    [K in keyof T as Extract<T[K], IsoAutoDateString> extends never ? K : never]: // Convert FileNameString to File
    T[K] extends infer U
      ? U extends FileNameString | FileNameString[]
        ? U extends any[]
          ? File[]
          : File
        : U
      : never;
  },
  'id'
>;

// Create type for Auth collections
export type CreateAuth<T> = {
  id?: RecordIdString;
  email: string;
  emailVisibility?: boolean;
  password: string;
  passwordConfirm: string;
  verified?: boolean;
} & ProcessCreateAndUpdateFields<T>;

// Create type for Base collections
export type CreateBase<T> = {
  id?: RecordIdString;
} & ProcessCreateAndUpdateFields<T>;

// Update type for Auth collections
export type UpdateAuth<T> = Partial<Omit<ProcessCreateAndUpdateFields<T>, keyof AuthSystemFields>> & {
  email?: string;
  emailVisibility?: boolean;
  oldPassword?: string;
  password?: string;
  passwordConfirm?: string;
  verified?: boolean;
};

// Update type for Base collections
export type UpdateBase<T> = Partial<Omit<ProcessCreateAndUpdateFields<T>, keyof BaseSystemFields>>;

// Get the correct create type for any collection
export type Create<T extends keyof CollectionResponses> = CollectionResponses[T] extends AuthSystemFields
  ? CreateAuth<CollectionRecords[T]>
  : CreateBase<CollectionRecords[T]>;

// Get the correct update type for any collection
export type Update<T extends keyof CollectionResponses> = CollectionResponses[T] extends AuthSystemFields
  ? UpdateAuth<CollectionRecords[T]>
  : UpdateBase<CollectionRecords[T]>;

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = {
  collection<T extends keyof CollectionResponses>(idOrName: T): RecordService<CollectionResponses[T]>;
} & PocketBase;

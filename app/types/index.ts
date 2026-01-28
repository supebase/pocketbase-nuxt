export * from './pocketbase-types';

export * from './auth';
export * from './posts';
export * from './comments';
export * from './likes';
export * from './notifications';
export * from './common';
export * from './server';

export interface GlobalApiResponse<T> {
  message: string;
  data: T;
}

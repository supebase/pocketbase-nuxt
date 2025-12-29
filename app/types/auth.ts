import 'nuxt-auth-utils';
import type { UsersResponse } from './pocketbase-types';

/**
 * 业务层用户基础类型
 * 使用 Pick 确保核心字段来自 PocketBase 生成定义
 */
export type UserRecord = Pick<UsersResponse, 'id' | 'email' | 'name' | 'avatar' | 'verified' | 'location'>;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  passwordConfirm: string;
  location: string;
}

export interface AuthResponse {
  message: string;
  data: {
    user: UserRecord;
  };
}

declare module '#auth-utils' {
  // 这里的 User 接口直接继承自我们定义的 UserRecord
  interface User extends UserRecord {}

  interface SecureSessionData {
    pbToken: string;
  }

  interface UserSession {
    user?: User;
    loggedInAt?: string;
  }
}

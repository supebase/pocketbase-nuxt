import type { RecordModel } from "pocketbase";

/**
 * 用户模型类型定义
 */
export interface UserModel extends RecordModel {
  // 基础用户字段
  email: string;
  emailVisibility: boolean;
  verified: boolean;

  // 自定义用户字段
  name?: string;
  avatar?: string;
  created: string;
  updated: string;
}

/**
 * 通用错误响应类型
 */
export interface ApiError {
  isError: true;
  message: string;
  errors?: Record<string, { code: string; message: string }>;
}

/**
 * 通用 API 响应类型
 */
export type ApiResponse<T> = T | ApiError;

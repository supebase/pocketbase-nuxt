/**
 * @file Pagination Utility
 * @description 统一从 HTTP 查询参数中提取、清洗并校验分页配置。
 */

import type { H3Event } from 'h3';

/** 分页默认值与限制配置 */
interface PaginationDefaults {
  page: number;
  perPage: number;
  maxPerPage: number;
}

/** 分页解析结果 */
interface PaginationResult {
  page: number;
  perPage: number;
  query: Record<string, any>;
}

/**
 * 获取并校验分页参数
 * @description 执行边界值清洗 (Clamping)：确保页码 >= 1，且步长不超过系统阈值。
 */
export const getPaginationParams = (
  event: H3Event,
  defaults: PaginationDefaults = { page: 1, perPage: 10, maxPerPage: 100 },
): PaginationResult => {
  const query = getQuery(event);

  // 强制页码最小值为 1
  const page = Math.max(1, Number(query.page) || defaults.page);

  // 步长约束逻辑：1 <= perPage <= maxPerPage
  const perPage = Math.min(defaults.maxPerPage, Math.max(1, Number(query.perPage) || defaults.perPage));

  return { page, perPage, query };
};

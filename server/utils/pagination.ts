import type { H3Event } from 'h3';

/**
 * 从请求中提取并校验分页参数
 * @param event H3 事件对象
 * @param defaults 可选的默认值配置
 */
export const getPaginationParams = (
  event: H3Event,
  defaults = { page: 1, perPage: 10, maxPerPage: 100 },
) => {
  const query = getQuery(event);

  const page = Math.max(1, Number(query.page) || defaults.page);

  const perPage = Math.min(
    defaults.maxPerPage,
    Math.max(1, Number(query.perPage) || defaults.perPage),
  );

  return { page, perPage, query };
};

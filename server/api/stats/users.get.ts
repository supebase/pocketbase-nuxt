/**
 * @file API Route: /api/stats/users [GET]
 * @description 获取用户统计的 API 端点。
 *              支持获取总用户数、今日新增用户数、30天活跃用户数。
 */
import { defineApiHandler } from '~~/server/utils/api-wrapper';

export default defineApiHandler(async (event) => {
  const pb = event.context.pb;

  try {
    const stats = await pb.collection('user_stats').getOne('global_metrics', {
      fields: 'total_users,today_new_users,active_users_30d',
    });

    return {
      message: '获取用户统计成功',
      data: stats,
    };
  } catch (e) {
    return {
      message: '统计数据暂不可用',
      data: { total_users: 0, today_new_users: 0, active_users_30d: 0 },
    };
  }
});

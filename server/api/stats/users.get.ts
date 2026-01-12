/**
 * @file API Route: /api/stats/users [GET]
 * @description 获取全站用户统计指标，包括总数、新增及活跃度。
 */

import { defineApiHandler } from '~~/server/utils/api-wrapper';

export default defineApiHandler(async (event) => {
  // 直接从 Context 中获取中间件已初始化的 PB 实例
  const pb = event.context.pb;

  try {
    // 获取全局统计度量：限定字段以优化查询性能
    const stats = await pb.collection('user_stats').getOne('global_metrics', {
      fields: 'total_users,today_new_users,active_users_30d',
    });

    return {
      message: '获取用户统计成功',
      data: stats,
    };
  } catch (e) {
    /**
     * 降级处理逻辑：
     * 若统计表记录尚未生成或查询失败，返回全零数据以确保前端 UI 不崩溃。
     */
    return {
      message: '统计数据暂不可用',
      data: { total_users: 0, today_new_users: 0, active_users_30d: 0 },
    };
  }
});

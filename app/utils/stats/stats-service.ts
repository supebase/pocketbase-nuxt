import type { RawUserStats, DisplayStatItem } from '~/types';

/**
 * 核心逻辑：计算增长率
 */
export const calculateGrowth = (today: number, yesterday: number): number => {
  if (yesterday === 0) return today > 0 ? 100 : 0;
  return Math.round(((today - yesterday) / yesterday) * 100);
};

/**
 * 转换函数：将 API 原始数据映射为 UI 卡片数据
 */
export const transformStatsToDisplay = (stats: Partial<RawUserStats>): DisplayStatItem[] => {
  const growth = calculateGrowth(stats.today_new_users || 0, stats.yesterday_new_users || 0);

  return [
    {
      label: '总用户数',
      value: stats.total_users || 0,
      icon: 'i-hugeicons:user-multiple-02',
      desc: '从创建至今的累积量',
    },
    {
      label: '今日新增',
      value: stats.today_new_users || 0,
      icon: 'i-hugeicons:user-add-02',
      desc: '较昨日',
      growth: growth,
    },
    {
      label: '活跃用户',
      value: stats.active_users_30d || 0,
      icon: 'i-hugeicons:chart-up',
      desc: '近 30 天有登录记录',
    },
  ];
};

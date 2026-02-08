import { useTimeAgo, type UseTimeAgoMessages } from '@vueuse/core';
import { timeMap } from '~/constants';

const messages: UseTimeAgoMessages = {
  justNow: '刚刚',
  past: (n) => timeMap[n] || (n.endsWith('前') ? n : `${n}前`),
  future: (n) => `${n}后`,
  second: (n, isPast) => (isPast && n < 10 ? '刚刚' : `${n} 秒`),
  minute: (n) => `${n} 分钟`,
  hour: (n) => `${n} 小时`,
  day: (n) => `${n} 天`,
  week: (n) => `${n} 周`,
  month: (n) => `${n} 个月`,
  year: (n) => `${n} 年`,
  invalid: '无效日期',
};

/**
 * 改进版相对时间
 */
export function useRelativeTime(date: string | Date | number | null | undefined) {
  if (!date) {
    return computed(() => '无效日期');
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return computed(() => '无效日期');
  }

  const timeAgo = useTimeAgo(parsedDate, {
    messages,
    max: 'year',
    fullDateFormatter: (date: Date) => {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    },
    updateInterval: 10000,
  });

  return timeAgo;
}

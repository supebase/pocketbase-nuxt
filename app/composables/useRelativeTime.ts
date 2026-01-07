import { useTimeAgo, type UseTimeAgoMessages } from '@vueuse/core';
import { computed, type ComputedRef } from 'vue';
import { timeMap } from '~/constants';

const fullDateFormatter = (date: Date): string => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const messages: UseTimeAgoMessages = {
  justNow: '刚刚',
  past: (n) => timeMap[n] || `${n}前`,
  future: (n) => `${n} 后`,
  second: (n) => (n < 10 ? '刚刚' : `${n} 秒前`), // 优化：10秒内都叫刚刚，减少水合冲突
  minute: (n) => `${n} 分钟`,
  hour: (n) => `${n} 小时`,
  day: (n) => `${n} 天`,
  week: (n) => `${n} 周`,
  month: (n) => `${n} 个月`,
  year: (n) => `${n} 年`,
  invalid: '无效日期',
};

/**
 * 修复版相对时间函数
 */
export function useRelativeTime(date: string | Date | number | null): ComputedRef<string> {
  // 1. 处理无效日期
  if (!date) return computed(() => messages.invalid as string);

  // 2. 转换日期对象
  const d = new Date(date);
  if (isNaN(d.getTime())) return computed(() => messages.invalid as string);

  // 3. SSR 兼容处理
  // 在服务器端，我们手动计算一个静态值，不启动定时器
  if (import.meta.server) {
    const now = Date.now();
    const diff = now - d.getTime();

    // 如果是服务器渲染，且时间在 1 分钟内，统一返回“刚刚”
    // 这能极大程度避免客户端激活时因几秒之差导致的水合失败
    if (diff < 60000 && diff >= 0) {
      return computed(() => '刚刚');
    }
  }

  // 4. 客户端使用 useTimeAgo（带定时器更新）
  // 注意：不再放入 computed 内部重复创建
  const timeAgo = useTimeAgo(d, {
    messages,
    max: 'year',
    fullDateFormatter,
    // 关键：控制同步频率，进一步降低冲突概率
    updateInterval: 10000,
  });

  return computed(() => timeAgo.value);
}

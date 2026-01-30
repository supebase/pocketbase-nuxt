/**
 * useGeoLocation
 * 获取用户地理位置信息的组合式函数
 */
import type { LocationData, UseGeoLocationReturn } from '~/types';

export const useGeoLocation = (): UseGeoLocationReturn => {
  // 保持 useState 确保 SSR 状态同步
  const locationData = useState<LocationData>('geo-location-data', () => ({
    location: '',
    ip: '',
  }));

  const isFetching = useState('geo-location-fetching', () => false);

  const fetchGeo = async () => {
    // 逻辑锁：已有 IP 或正在请求中则跳过
    if (locationData.value.ip || isFetching.value) return;

    isFetching.value = true;

    try {
      // 使用 $fetch 请求我们刚写好的 ip.get.ts 接口
      const data = await $fetch<{ ip: string; location: string }>('/api/ip');

      // 赋值逻辑：优先使用 location，如果没有则回退显示 IP
      locationData.value = {
        ip: data.ip || '未知IP',
        location: data.location || '未知位置',
      };
    } catch (error) {
      // 这里的兜底很重要，防止前端因为接口 500 而挂掉
      locationData.value = {
        ip: '0.0.0.0',
        location: '未知位置',
      };
    } finally {
      isFetching.value = false;
    }
  };

  return {
    locationData,
    fetchGeo,
  };
};

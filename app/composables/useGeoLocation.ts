/**
 * useGeoLocation
 * 获取用户地理位置信息的组合式函数
 */
import type { LocationData, UseGeoLocationReturn } from '~/types/common';

export const useGeoLocation = (): UseGeoLocationReturn => {
  // 使用 useState 确保 SSR 状态同步
  const locationData = useState<LocationData>('geo-location-data', () => ({
    location: '地球',
    ip: '未知IP',
  }));

  // 请求锁，防止并发重复请求
  const isFetching = useState('geo-location-fetching', () => false);

  const fetchGeo = async () => {
    // 如果已经获取过（非默认值）或者正在请求，则拦截
    if (locationData.value.location !== '地球' || isFetching.value) return;

    isFetching.value = true;

    try {
      // 只需要请求一个接口，一次性拿到所有信息
      const data = await $fetch<{ ip: string; location: string }>('/api/ip');

      locationData.value = {
        ip: data.ip,
        location: data.location || data.ip,
      };
    } catch (error) {
      console.error('[GeoLocation Error]:', error);
      // 极端情况下的最终兜底
      locationData.value.location = '未知地址';
    } finally {
      isFetching.value = false;
    }
  };

  return {
    locationData,
    fetchGeo,
  };
};

/**
 * useGeoLocation
 * 获取用户地理位置信息的组合式函数
 * - 通过远程 API 获取用户 IP 和地理位置
 * - 提供默认兜底值，保证健壮性
 * @returns 包含 ip 和 location 的对象
 */
export const useGeoLocation = () => {
  const locationData = useState('geo-location-data', () => ({
    ip: '未知',
    location: '地球',
  }));

  const fetchGeo = async () => {
    // 如果已经获取过了，就不重复请求
    if (locationData.value.location !== '地球') return;

    try {
      const config = useRuntimeConfig();
      const data = await $fetch<any>(config.public.geoLocation, {
        timeout: 3000,
      });

      if (data?.ipinfo?.text && data?.ipdata?.info1) {
        locationData.value = {
          ip: data.ipinfo.text,
          location: data.ipdata.info1,
        };
      }
    } catch (error) {
      console.warn('用户归属地获取失败');
    }
  };

  return {
    locationData,
    fetchGeo,
  };
};

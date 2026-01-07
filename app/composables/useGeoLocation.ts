/**
 * useGeoLocation
 * 获取用户地理位置信息的组合式函数
 */
export const useGeoLocation = () => {
  const locationData = useState('geo-location-data', () => ({
    location: '地球',
  }));

  const fetchGeo = async () => {
    // 1. 如果已经获取过了，就不重复请求
    if (locationData.value.location !== '地球') return;

    let realIp = '未知IP';

    try {
      // 2. 首先从我们自己的服务器接口获取真实客户端 IP
      const ipRes = await $fetch<{ ip: string }>('/api/ip');

      realIp = ipRes.ip;

      // 3. 处理本地回环地址
      if (realIp === '127.0.0.1' || realIp === '::1') {
        locationData.value.location = '内网地址';
        return;
      }

      // 4. 尝试调用归属地 API
      const config = useRuntimeConfig();
      const data = await $fetch<any>(`${config.public.geoLocation}?ip=${realIp}`, {
        timeout: 3000,
      });

      // 5. 核心逻辑判断
      const info = data?.ipdata?.info1;

      if (info) {
        // 如果接口返回的是“保留IP”或包含“局域网”相关的描述
        if (info.includes('保留IP') || info.includes('局域网') || info.includes('私有')) {
          locationData.value.location = '内网地址';
        } else {
          locationData.value.location = info;
        }
      } else {
        // 接口没有返回具体信息，使用 IP 兜底
        locationData.value.location = realIp;
      }
    } catch (error) {
      // 6. 最终兜底：如果外部接口报错/超时，直接使用真实 IP
      console.warn('归属地 API 异常，降级使用 IP');
      locationData.value.location = realIp;
    }
  };

  return {
    locationData,
    fetchGeo,
  };
};

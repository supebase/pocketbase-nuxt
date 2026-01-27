/**
 * @file Client IP Helper
 * @description 提取请求发起方的真实 IP 地址并聚合归属地信息。
 */
import { INTERNAL_IP_PATTERN } from '~/constants';

export default defineEventHandler(async (event) => {
  // 1. 获取真实 IP
  const ip = getRequestIP(event, { xForwardedFor: true }) || '127.0.0.1';

  // 2. 优先进行内网/本地判别 (使用你引入的正则)
  if (INTERNAL_IP_PATTERN.test(ip)) {
    return {
      ip,
      location: '内网地址',
    };
  }

  // 默认返回数据结构
  const result = {
    ip,
    location: ip, // 默认位置设为 IP，方便兜底
  };

  try {
    const config = useRuntimeConfig();

    // 3. 服务端请求外部 API (受保护的环境)
    const data = await $fetch<{ ipdata: { info1: string } }>(config.geoLocation, {
      params: { ip },
      timeout: 3000,
    });

    const info = data?.ipdata?.info1;

    if (info && info !== ip) {
      // 再次校验 API 返回的内容是否涉及私有地址描述
      const isInternalDesc = /保留IP|局域网|私有|本机地址/i.test(info);
      if (isInternalDesc) {
        result.location = '内网地址';
      } else {
        result.location = info;
      }
    }
  } catch (error) {
    // 4. 报错降级：console 记录错误，但返回给前端基本 IP 信息
    // console.error('[Server Geo Error]:', error);
  }

  return result;
});

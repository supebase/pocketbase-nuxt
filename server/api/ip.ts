/**
 * @file Client IP Helper
 * @description 提取请求发起方的真实 IP 地址。
 */

export default defineEventHandler((event) => {
  // 提取真实客户端 IP
  // 配置 xForwardedFor: true 以解析代理请求头（如 Nginx/Vercel 转发的真实 IP）
  const ip = getRequestIP(event, { xForwardedFor: true }) || '未知 IP';

  return { ip };
});

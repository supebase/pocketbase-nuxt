import path from 'node:path';
import fs from 'node:fs';
import { IPv4, IPv6, newWithBuffer } from 'ip2region.js';
import { INTERNAL_IP_PATTERN } from '~/constants';

let searcherV4: any = null;
let searcherV6: any = null;

const initSearchers = () => {
  const config = useRuntimeConfig();
  let dataDir = '';

  // 1. 严格环境隔离
  if (import.meta.dev) {
    // 开发环境：强制指向项目根目录下的 server/data
    dataDir = path.resolve(process.cwd(), 'server/data');
  } else {
    // 生产环境：优先读取环境变量，如果没有配置，则回退到 .output 同级的 data 目录
    dataDir = config.ipDataPath || path.resolve(process.cwd(), 'data');
  }

  // 2. 初始化 V4 (增加 debug 日志，如果你在测试时还是不通，可以看一眼控制台)
  if (!searcherV4) {
    try {
      const dbPathV4 = path.join(dataDir, 'ip2region_v4.xdb');
      if (fs.existsSync(dbPathV4)) {
        searcherV4 = newWithBuffer(IPv4, fs.readFileSync(dbPathV4));
      } else if (process.dev) {
        console.error(`[ip2region] 未找到 V4 数据库文件: ${dbPathV4}`);
      }
    } catch (e) {
      console.error('[ip2region] V4 初始化失败', e);
    }
  }

  // 3. 初始化 V6
  if (!searcherV6) {
    try {
      const dbPathV6 = path.join(dataDir, 'ip2region_v6.xdb');
      if (fs.existsSync(dbPathV6)) {
        searcherV6 = newWithBuffer(IPv6, fs.readFileSync(dbPathV6));
      }
    } catch (e) {}
  }
};

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || '127.0.0.1';
  const result = { ip, location: ip };

  if (INTERNAL_IP_PATTERN.test(ip)) {
    result.location = '内网地址';
    return result;
  }

  try {
    initSearchers();

    const isIPv6 = ip.includes(':');
    const activeSearcher = isIPv6 ? searcherV6 : searcherV4;

    if (activeSearcher) {
      const searchResult = await activeSearcher.search(ip);

      let region = '';
      if (typeof searchResult === 'string') {
        region = searchResult;
      } else if (searchResult && typeof searchResult === 'object') {
        region = (searchResult as any).region || '';
      }

      if (region && region !== '0') {
        const parts = region.split('|');
        if (parts.length >= 3) {
          const country = parts[0] || '';
          const province = parts[1] || '';

          if (country === '中国') {
            if (province === '0' || !province) {
              result.location = '中国';
            } else {
              result.location = province.replace(/省|自治区|特别行政区|壮族|回族|维吾尔/g, '');
            }
          } else if (country === '内网IP' || province === '内网IP') {
            result.location = '内网地址';
          } else {
            result.location = country || ip;
          }
        }
      }
    }
  } catch (error) {
    // 捕获异常
  }

  return result;
});

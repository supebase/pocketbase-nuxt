export const MAX_COOKIE_AGE = 60 * 60 * 24 * 7; // 7 天
export const MAX_VIEW_COOKIE_AGE = 60 * 60 * 24; // 1 天
export const MAX_CACHE_SIZE = 2000; // 缓存大小
export const MIN_SEARCH_LENGTH = 2; // 搜索最小长度
export const MENTION_REGEX = /(@\S+\s?)/g; // 提及正则表达式
export const CONTENT_MAX_LENGTH = 10000; // 内容最大长度
export const COMMENT_MAX_LENGTH = 300; // 评论最大长度
export const MD_IMAGE_MAX_SIZE = 2 * 1024 * 1024; // 限制最大 2MB
export const DEFAULT_IMAGE_CONCURRENCY = 3; // 默认并发数
export const IMAGE_DOWNLOAD_TIMEOUT = 8000; // 超时时间
export const INTERNAL_IP_PATTERN = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|::1)/;

export const timeMap: Record<string, string> = {
  '1 天': '昨天',
  '2 天': '前天',
  '1 周': '上周',
  '1 个月': '上个月',
  '1 年': '去年',
};

/**
 * 阅读速度配置常量
 */
export const READ_SPEED_CONFIG = {
  WORDS_PER_MINUTE: 180, // 英文：约 180 词/分
  CHINESE_CHARS_PER_MINUTE: 350, // 中文：约 350 字/分
  IMAGE_TIME: 0.2, // 每张图约 12 秒
  CAROUSEL_BASE_TIME: 0.2, // 图片渲染/切换基础耗时
  CODE_BLOCK_BASE_TIME: 0.2, // 进入代码阅读状态的心理切换时间
  CODE_LINE_TIME: 0.05, // 每行代码约 3 秒（代码阅读通常比文本慢）
} as const;

export const TABS = [
  {
    label: '登录我的账户',
    value: 'login',
    description: '使用电子邮件和密码登录到您的账户。',
  },
  {
    label: '免费创建账户',
    value: 'register',
    description: '创建一个新账户，完成后即可自动登录。',
  },
];

export const placeholders = [
  '聚焦核心话题，留下你的专业分析',
  '理性发声，用观点传递价值',
  '干货满满，说说你的独到见解',
  '专业视角交流，助力经验沉淀',
];

export const actionItems = [
  { label: '贴文', description: '记录观点、动态与生活', value: 'dit' },
  { label: '分享', description: '转发并分享优质内容', value: 'partager' },
];

export const COOLDOWN_MS = 30 * 1000;
export const REACTIONS = ['👍', '🤙', '🌮', '🍺', '👀'];

export const getRandomUA = () => {
  const UAs = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  ];

  return UAs[Math.floor(Math.random() * UAs.length)];
};
